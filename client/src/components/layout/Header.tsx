import { useState } from "react";
import { Search, Plus, Menu as MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMenu } from "@/hooks/use-menu";
import { Link } from "wouter";

const Header = () => {
  const { toggleMenu } = useMenu();
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const toggleSearchBar = () => {
    setShowMobileSearch(!showMobileSearch);
  };

  return (
    <>
      <header className="sticky top-0 bg-white p-4 flex items-center justify-between shadow-sm z-10">
        <button 
          className="md:hidden flex items-center justify-center" 
          onClick={toggleMenu}
        >
          <MenuIcon className="h-6 w-6" />
        </button>
        
        <Link href="/">
          <a className="logo font-bold text-xl ml-2 md:ml-0">KORA</a>
        </Link>
        
        <div className="hidden md:flex items-center space-x-6 flex-1 ml-10">
          <form className="search-form flex-1 max-w-xl">
            <div className="relative">
              <Input 
                type="text" 
                placeholder="Search" 
                className="w-full rounded-full py-2 px-4 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-secondary"
              />
              <Button 
                type="submit" 
                variant="ghost" 
                className="absolute right-1 top-1 h-8 w-8 p-0"
              >
                <Search className="h-4 w-4 text-gray-500" />
              </Button>
            </div>
          </form>
        </div>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="create-btn bg-white rounded-full p-2 md:ml-4"
        >
          <Plus className="h-5 w-5 text-gray-700" />
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden ml-2" 
          onClick={toggleSearchBar}
        >
          <Search className="h-5 w-5 text-gray-700" />
        </Button>
      </header>

      {/* Mobile Search Bar (hidden by default) */}
      {showMobileSearch && (
        <div className="p-3 bg-white shadow-sm">
          <form className="w-full">
            <div className="relative">
              <Input 
                type="text" 
                placeholder="Search" 
                className="w-full rounded-full py-2 px-4 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-secondary"
              />
              <Button 
                type="submit" 
                variant="ghost" 
                className="absolute right-1 top-1 h-8 w-8 p-0"
              >
                <Search className="h-4 w-4 text-gray-500" />
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default Header;
