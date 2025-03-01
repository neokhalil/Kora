import React, { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar as CalendarIcon, 
  Search, 
  Filter, 
  Book, 
  Calculator, 
  Microscope, 
  Globe, 
  Star, 
  StarOff,
  Image as ImageIcon,
  Mic,
  MessageSquare,
  Clock,
  Tag,
  Download,
  Share2,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { DateRange } from 'react-day-picker';
import { addDays, format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Types
interface Field {
  id: number;
  name: string;
  description: string | null;
  iconName: string | null;
  interactionCount: number;
}

interface Topic {
  id: number;
  title: string;
  description: string | null;
  fieldId: number | null;
  interactionCount: number;
}

interface Tag {
  id: number;
  name: string;
  type: string;
  interactionCount: number;
}

interface Interaction {
  id: number;
  userId: number | null;
  topicId: number | null;
  question: string;
  answer: string;
  type: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  starred: boolean;
  metadata: Record<string, any>;
}

interface InteractionWithDetails extends Interaction {
  topic: Topic;
  field: {
    id: number;
    name: string;
    description: string | null;
    iconName: string | null;
  };
  tags: Tag[];
}

interface InteractionInsight {
  topicId: number;
  topicTitle: string;
  fieldId: number;
  fieldName: string;
  count: number;
  lastInteractionDate: string;
}

// Get icon component based on name
const getFieldIcon = (iconName: string | null) => {
  switch (iconName) {
    case 'calculator':
      return <Calculator className="h-5 w-5" />;
    case 'book':
      return <Book className="h-5 w-5" />;
    case 'microscope':
      return <Microscope className="h-5 w-5" />;
    case 'globe':
      return <Globe className="h-5 w-5" />;
    default:
      return <Book className="h-5 w-5" />;
  }
};

// Get interaction type icon
const getInteractionTypeIcon = (type: string) => {
  switch (type) {
    case 'image':
      return <ImageIcon className="h-4 w-4" />;
    case 'voice':
      return <Mic className="h-4 w-4" />;
    case 'text':
    default:
      return <MessageSquare className="h-4 w-4" />;
  }
};

// Format date to human-readable
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return format(date, 'dd/MM/yyyy - HH:mm');
};

// FieldSelector component
const FieldSelector = ({ 
  fields, 
  selectedFieldId, 
  onSelectField,
  isLoading
}: { 
  fields: Field[], 
  selectedFieldId: number | null,
  onSelectField: (fieldId: number | null) => void,
  isLoading: boolean
}) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      <Button 
        variant={selectedFieldId === null ? "secondary" : "outline"} 
        className="w-full justify-start"
        onClick={() => onSelectField(null)}
      >
        <Book className="mr-2 h-5 w-5" />
        Tous les domaines
      </Button>
      
      {fields.map(field => (
        <Button 
          key={field.id}
          variant={selectedFieldId === field.id ? "secondary" : "outline"} 
          className="w-full justify-between"
          onClick={() => onSelectField(field.id)}
        >
          <div className="flex items-center max-w-[65%]">
            {getFieldIcon(field.iconName)}
            <span className="ml-2 overflow-hidden text-ellipsis whitespace-nowrap">{field.name}</span>
          </div>
          <Badge variant="secondary" className="ml-2">
            {field.interactionCount} {field.interactionCount === 1 ? 'interaction' : 'interactions'}
          </Badge>
        </Button>
      ))}
    </div>
  );
};

// TopicList component
const TopicList = ({ 
  topics, 
  selectedTopicId, 
  onSelectTopic,
  isLoading
}: { 
  topics: Topic[], 
  selectedTopicId: number | null,
  onSelectTopic: (topicId: number | null) => void,
  isLoading: boolean
}) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }
  
  if (topics.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Aucun sujet trouvé dans ce domaine.
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      <Button 
        variant={selectedTopicId === null ? "secondary" : "outline"} 
        className="w-full justify-start"
        onClick={() => onSelectTopic(null)}
      >
        <Book className="mr-2 h-5 w-5" />
        Tous les sujets
      </Button>
      
      {topics.map(topic => (
        <Button 
          key={topic.id}
          variant={selectedTopicId === topic.id ? "secondary" : "outline"} 
          className="w-full justify-between"
          onClick={() => onSelectTopic(topic.id)}
        >
          <span className="text-left overflow-hidden text-ellipsis whitespace-nowrap max-w-[65%]">{topic.title}</span>
          <Badge variant="secondary" className="ml-2">
            {topic.interactionCount} {topic.interactionCount === 1 ? 'interaction' : 'interactions'}
          </Badge>
        </Button>
      ))}
    </div>
  );
};

// TagList component
const TagList = ({ 
  tags, 
  selectedTagName, 
  onSelectTag,
  isLoading
}: { 
  tags: Tag[], 
  selectedTagName: string | null,
  onSelectTag: (tagName: string | null) => void,
  isLoading: boolean
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-20" />
      </div>
    );
  }
  
  if (tags.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        Aucun tag trouvé.
      </div>
    );
  }
  
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map(tag => (
        <Badge 
          key={tag.id}
          variant={selectedTagName === tag.name ? "default" : "outline"} 
          className="cursor-pointer"
          onClick={() => onSelectTag(selectedTagName === tag.name ? null : tag.name)}
        >
          {tag.name}
          <span className="ml-1 text-xs">({tag.interactionCount})</span>
        </Badge>
      ))}
    </div>
  );
};

// InteractionCard component
const InteractionCard = ({ 
  interaction,
  onToggleStar
}: { 
  interaction: InteractionWithDetails,
  onToggleStar: (id: number, starred: boolean) => void
}) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {getInteractionTypeIcon(interaction.type)}
              <span className="ml-1">{interaction.type}</span>
            </Badge>
            <div className="text-xs text-muted-foreground flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {formatDate(interaction.createdAt)}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleStar(interaction.id, !interaction.starred)}
            className="h-8 w-8"
          >
            {interaction.starred ? (
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            ) : (
              <StarOff className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg mt-2">{interaction.question.substring(0, 100)}{interaction.question.length > 100 ? '...' : ''}</CardTitle>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="secondary">
            {getFieldIcon(interaction.field?.iconName)}
            <span className="ml-1">{interaction.field?.name || 'Champ inconnu'}</span>
          </Badge>
          <Badge variant="secondary">
            {interaction.topic?.title || 'Sujet inconnu'}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {interaction.tags?.map(tag => (
            <Badge key={tag.id} variant="outline" className="text-xs">
              {tag.name}
            </Badge>
          )) || null}
        </div>
      </CardHeader>
      <CardContent>
        <div 
          className={cn(
            "prose dark:prose-invert max-w-none text-sm", 
            !expanded && "line-clamp-3"
          )}
          dangerouslySetInnerHTML={{ __html: interaction.answer?.replace(/\n/g, '<br />') || 'Pas de réponse disponible' }}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="mt-2 h-8 text-xs"
        >
          {expanded ? 'Voir moins' : 'Voir plus'}
        </Button>
        
        {interaction.imageUrl && (
          <div className="mt-4">
            <img 
              src={interaction.imageUrl} 
              alt="Question image" 
              className="max-h-64 rounded-md object-contain mx-auto border border-border" 
            />
          </div>
        )}
        
        <div className="flex gap-2 mt-4 justify-end">
          <Button variant="outline" size="sm" className="text-xs">
            <Download className="h-3 w-3 mr-1" />
            Exporter
          </Button>
          <Button variant="outline" size="sm" className="text-xs">
            <Share2 className="h-3 w-3 mr-1" />
            Partager
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// InteractionList component
const InteractionList = ({ 
  interactions, 
  isLoading,
  onToggleStar
}: { 
  interactions: InteractionWithDetails[], 
  isLoading: boolean,
  onToggleStar: (id: number, starred: boolean) => void
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  
  if (interactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Aucune interaction trouvée avec les filtres actuels.
      </div>
    );
  }
  
  return (
    <div>
      {interactions.map(interaction => (
        <InteractionCard 
          key={interaction.id} 
          interaction={interaction}
          onToggleStar={onToggleStar}
        />
      ))}
    </div>
  );
};

// HistoryInsights component
const HistoryInsights = ({ 
  insights,
  isLoading
}: {
  insights: InteractionInsight[],
  isLoading: boolean
}) => {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }
  
  if (insights.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        Pas encore suffisamment de données pour générer des insights.
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {insights.map(insight => (
        <Card key={insight.topicId} className="p-3">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium">{insight.topicTitle}</h4>
              <p className="text-sm text-muted-foreground">{insight.fieldName}</p>
            </div>
            <Badge>{insight.count} interactions</Badge>
          </div>
        </Card>
      ))}
    </div>
  );
};

// Main LearningHistory component
export default function LearningHistory() {
  // Media query for responsive layout
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  // State management for filters
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [selectedTagName, setSelectedTagName] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30), // Last 30 days by default
    to: new Date(),
  });
  const [starredOnly, setStarredOnly] = useState(false);
  
  // Temporary user ID (should come from auth context in a real app)
  const userId = 1;
  
  // Queries for data fetching
  const { data: fields, isLoading: isLoadingFields } = useQuery({
    queryKey: ['/api/fields/with-counts'],
    queryFn: () => apiRequest('/api/fields/with-counts')
  });
  
  const { data: topics, isLoading: isLoadingTopics } = useQuery({
    queryKey: ['/api/topics/with-counts', selectedFieldId],
    queryFn: () => {
      if (selectedFieldId) {
        return apiRequest(`/api/topics/by-field/${selectedFieldId}`);
      }
      return apiRequest('/api/topics/with-counts');
    }
  });
  
  const { data: tags, isLoading: isLoadingTags } = useQuery({
    queryKey: ['/api/tags/with-counts'],
    queryFn: () => apiRequest('/api/tags/with-counts')
  });
  
  const { data: insights, isLoading: isLoadingInsights } = useQuery({
    queryKey: ['/api/insights/frequent-topics', userId],
    queryFn: () => apiRequest(`/api/insights/frequent-topics?userId=${userId}&limit=5`)
  });
  
  // Build query params for interactions
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    
    params.append('userId', userId.toString());
    
    if (selectedTopicId !== null) {
      params.append('topicId', selectedTopicId.toString());
    } else if (selectedFieldId !== null) {
      params.append('fieldId', selectedFieldId.toString());
    }
    
    if (selectedType !== null && selectedType !== 'all') {
      params.append('type', selectedType);
    }
    
    if (searchQuery.trim()) {
      params.append('searchTerm', searchQuery);
    }
    
    if (selectedTagName) {
      params.append('tag', selectedTagName);
    }
    
    if (dateRange?.from) {
      params.append('startDate', dateRange.from.toISOString());
    }
    
    if (dateRange?.to) {
      params.append('endDate', dateRange.to.toISOString());
    }
    
    if (starredOnly) {
      params.append('starred', 'true');
    }
    
    params.append('limit', '50'); // Limit to 50 interactions
    
    return params.toString();
  };
  
  // Query for filtered interactions
  const queryParams = buildQueryParams();
  const { 
    data: interactions, 
    isLoading: isLoadingInteractions,
    refetch: refetchInteractions
  } = useQuery({
    queryKey: ['/api/interactions', queryParams],
    queryFn: () => apiRequest(`/api/interactions?${queryParams}`),
    enabled: true,
  });
  
  // Handle toggling star status
  const handleToggleStar = async (id: number, starred: boolean) => {
    try {
      await apiRequest(`/api/interactions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ starred })
      });
      
      // Refresh interactions
      refetchInteractions();
      
      toast({
        title: starred ? "Interaction marquée" : "Marqueur retiré",
        description: starred ? "L'interaction a été ajoutée à vos favoris." : "L'interaction a été retirée de vos favoris.",
      });
    } catch (error) {
      console.error('Error toggling star:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut de l'interaction.",
        variant: "destructive",
      });
    }
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSelectedFieldId(null);
    setSelectedTopicId(null);
    setSelectedTagName(null);
    setSelectedType(null);
    setSearchQuery('');
    setDateRange({
      from: addDays(new Date(), -30),
      to: new Date(),
    });
    setStarredOnly(false);
  };
  
  // Effect to refetch interactions when filters change
  useEffect(() => {
    refetchInteractions();
  }, [selectedFieldId, selectedTopicId, selectedTagName, selectedType, searchQuery, starredOnly, dateRange]);
  
  // Render mobile layout
  if (isMobile) {
    return (
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-4">Historique d'apprentissage</h1>
        
        <Tabs defaultValue="interactions" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="interactions" className="flex-1">Interactions</TabsTrigger>
            <TabsTrigger value="insights" className="flex-1">Insights</TabsTrigger>
            <TabsTrigger value="filters" className="flex-1">Filtres</TabsTrigger>
          </TabsList>
          
          <TabsContent value="interactions" className="mt-4">
            <div className="mb-4 flex">
              <Input
                placeholder="Rechercher dans l'historique..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mr-2"
              />
              <Button variant="outline" onClick={() => refetchInteractions()}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            
            <InteractionList 
              interactions={interactions || []}
              isLoading={isLoadingInteractions}
              onToggleStar={handleToggleStar}
            />
          </TabsContent>
          
          <TabsContent value="insights" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Vos sujets les plus fréquents</CardTitle>
                <CardDescription>
                  Basé sur vos interactions récentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <HistoryInsights 
                  insights={insights || []}
                  isLoading={isLoadingInsights}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="filters" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Filtres</CardTitle>
                <CardDescription>
                  Affinez votre historique d'apprentissage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Domaines</h3>
                  <FieldSelector 
                    fields={fields || []}
                    selectedFieldId={selectedFieldId}
                    onSelectField={setSelectedFieldId}
                    isLoading={isLoadingFields}
                  />
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Sujets</h3>
                  <TopicList 
                    topics={topics || []}
                    selectedTopicId={selectedTopicId}
                    onSelectTopic={setSelectedTopicId}
                    isLoading={isLoadingTopics}
                  />
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Type</h3>
                  <div className="flex gap-2">
                    <Button
                      variant={selectedType === null ? "secondary" : "outline"}
                      onClick={() => setSelectedType(null)}
                      size="sm"
                    >
                      Tous
                    </Button>
                    <Button
                      variant={selectedType === 'text' ? "secondary" : "outline"}
                      onClick={() => setSelectedType('text')}
                      size="sm"
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Texte
                    </Button>
                    <Button
                      variant={selectedType === 'image' ? "secondary" : "outline"}
                      onClick={() => setSelectedType('image')}
                      size="sm"
                    >
                      <ImageIcon className="h-4 w-4 mr-1" />
                      Image
                    </Button>
                    <Button
                      variant={selectedType === 'voice' ? "secondary" : "outline"}
                      onClick={() => setSelectedType('voice')}
                      size="sm"
                    >
                      <Mic className="h-4 w-4 mr-1" />
                      Voix
                    </Button>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Période</h3>
                  <div className="grid gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="date"
                          variant={"outline"}
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange?.from ? (
                            dateRange.to ? (
                              <>
                                {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                              </>
                            ) : (
                              format(dateRange.from, "dd/MM/yyyy")
                            )
                          ) : (
                            <span>Sélectionner une période</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={dateRange?.from}
                          selected={dateRange}
                          onSelect={setDateRange}
                          numberOfMonths={1}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Tags</h3>
                  <TagList 
                    tags={tags || []}
                    selectedTagName={selectedTagName}
                    onSelectTag={setSelectedTagName}
                    isLoading={isLoadingTags}
                  />
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Autres filtres</h3>
                  <Button
                    variant={starredOnly ? "secondary" : "outline"}
                    onClick={() => setStarredOnly(!starredOnly)}
                    className="w-full justify-start"
                  >
                    <Star className="mr-2 h-4 w-4" />
                    Uniquement les favoris
                  </Button>
                </div>
                
                <Separator />
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={resetFilters}>
                    Réinitialiser
                  </Button>
                  <Button onClick={() => refetchInteractions()}>
                    Appliquer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }
  
  // Render desktop layout
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Historique d'apprentissage</h1>
      
      <div className="grid grid-cols-12 gap-6">
        {/* Left sidebar */}
        <div className="col-span-3">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Filtres</CardTitle>
              <CardDescription>
                Affinez votre historique d'apprentissage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-2">Domaines</h3>
                <FieldSelector 
                  fields={fields || []}
                  selectedFieldId={selectedFieldId}
                  onSelectField={setSelectedFieldId}
                  isLoading={isLoadingFields}
                />
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium mb-2">Sujets</h3>
                <TopicList 
                  topics={topics || []}
                  selectedTopicId={selectedTopicId}
                  onSelectTopic={setSelectedTopicId}
                  isLoading={isLoadingTopics}
                />
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium mb-2">Type</h3>
                <div className="flex gap-2">
                  <Button
                    variant={selectedType === null ? "secondary" : "outline"}
                    onClick={() => setSelectedType(null)}
                    size="sm"
                  >
                    Tous
                  </Button>
                  <Button
                    variant={selectedType === 'text' ? "secondary" : "outline"}
                    onClick={() => setSelectedType('text')}
                    size="sm"
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Texte
                  </Button>
                  <Button
                    variant={selectedType === 'image' ? "secondary" : "outline"}
                    onClick={() => setSelectedType('image')}
                    size="sm"
                  >
                    <ImageIcon className="h-4 w-4 mr-1" />
                    Image
                  </Button>
                  <Button
                    variant={selectedType === 'voice' ? "secondary" : "outline"}
                    onClick={() => setSelectedType('voice')}
                    size="sm"
                  >
                    <Mic className="h-4 w-4 mr-1" />
                    Voix
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium mb-2">Période</h3>
                <div className="grid gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="date"
                        variant={"outline"}
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                            </>
                          ) : (
                            format(dateRange.from, "dd/MM/yyyy")
                          )
                        ) : (
                          <span>Sélectionner une période</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium mb-2">Tags</h3>
                <TagList 
                  tags={tags || []}
                  selectedTagName={selectedTagName}
                  onSelectTag={setSelectedTagName}
                  isLoading={isLoadingTags}
                />
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium mb-2">Autres filtres</h3>
                <Button
                  variant={starredOnly ? "secondary" : "outline"}
                  onClick={() => setStarredOnly(!starredOnly)}
                  className="w-full justify-start"
                >
                  <Star className="mr-2 h-4 w-4" />
                  Uniquement les favoris
                </Button>
              </div>
              
              <Separator />
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetFilters}>
                  Réinitialiser
                </Button>
                <Button onClick={() => refetchInteractions()}>
                  Appliquer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main content */}
        <div className="col-span-6">
          <div className="mb-6 flex">
            <Input
              placeholder="Rechercher dans l'historique..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mr-2"
            />
            <Button variant="outline" onClick={() => refetchInteractions()}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
          
          <InteractionList 
            interactions={interactions || []}
            isLoading={isLoadingInteractions}
            onToggleStar={handleToggleStar}
          />
        </div>
        
        {/* Right sidebar - Insights */}
        <div className="col-span-3">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Vos sujets les plus fréquents</CardTitle>
              <CardDescription>
                Basé sur vos interactions récentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HistoryInsights 
                insights={insights || []}
                isLoading={isLoadingInsights}
              />
            </CardContent>
          </Card>
          
          {/* Additional insights could go here */}
        </div>
      </div>
    </div>
  );
}