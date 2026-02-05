import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, X, Clock, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { cn, capitalizeFirst, normalizeText } from "@/lib/utils";

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price_huf: number;
  category_id?: string;
  image_url?: string;
  is_temporary?: boolean;
}

interface MenuCategory {
  id: string;
  name: string;
  sort: number;
}

interface FoodSearchCommandProps {
  items: MenuItem[];
  categories: MenuCategory[];
  selectedItemIds: string[];
  onSelectItem: (itemId: string) => void;
  recentlyUsedIds?: string[];
}

export const FoodSearchCommand = ({
  items,
  categories,
  selectedItemIds,
  onSelectItem,
  recentlyUsedIds = []
}: FoodSearchCommandProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isExpanded, setIsExpanded] = useState(true);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter items based on search and category, excluding already selected
  const availableItems = items.filter(item => !selectedItemIds.includes(item.id));
  
  const filteredItems = availableItems.filter(item => {
    const normalizedSearch = normalizeText(searchTerm);
    const matchesSearch = searchTerm === "" || 
      normalizeText(item.name).includes(normalizedSearch) ||
      (item.description && normalizeText(item.description).includes(normalizedSearch));
    const matchesCategory = selectedCategory === "all" || item.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get recently used items that are available
  const recentItems = recentlyUsedIds
    .map(id => availableItems.find(item => item.id === id))
    .filter(Boolean) as MenuItem[];

  // Show results when there's a search term OR a specific category is selected
  const showSearchResults = searchTerm !== "" || selectedCategory !== "all";
  
  // Show recently used only when no search term and no category filter
  const showRecentlyUsed = !showSearchResults && recentItems.length > 0;

  // Reset highlighted index when results change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchTerm, selectedCategory]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const itemsToShow = showRecentlyUsed ? recentItems : filteredItems;
    
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < itemsToShow.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case "Enter":
        e.preventDefault();
        if (itemsToShow[highlightedIndex]) {
          onSelectItem(itemsToShow[highlightedIndex].id);
          setSearchTerm("");
        }
        break;
      case "Escape":
        e.preventDefault();
        setSearchTerm("");
        inputRef.current?.blur();
        break;
    }
  }, [filteredItems, recentItems, highlightedIndex, onSelectItem, showRecentlyUsed]);

  // Scroll highlighted item into view
  useEffect(() => {
    const highlightedEl = listRef.current?.querySelector(`[data-index="${highlightedIndex}"]`);
    highlightedEl?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex]);

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return "Egyéb";
    return categories.find(c => c.id === categoryId)?.name || "Egyéb";
  };

  const handleItemClick = (itemId: string) => {
    onSelectItem(itemId);
    setSearchTerm("");
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-3">
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-base lg:text-lg font-semibold flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          Gyors étel hozzáadás
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-8 px-2"
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {isExpanded && (
        <>
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Kezdj el gépelni az étel nevét... (pl. gulyás)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-10 pr-10 h-12 text-base"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Category Quick Filters */}
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedCategory === "all" ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary/80 transition-colors"
              onClick={() => setSelectedCategory("all")}
            >
              Összes ({availableItems.length})
            </Badge>
            {categories.slice(0, 8).map(category => {
              const count = availableItems.filter(i => i.category_id === category.id).length;
              if (count === 0) return null;
              return (
                <Badge
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/80 transition-colors"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name} ({count})
                </Badge>
              );
            })}
            {categories.length > 8 && (
              <Badge variant="outline" className="text-muted-foreground">
                +{categories.length - 8} további
              </Badge>
            )}
          </div>

          {/* Results */}
          <div ref={listRef}>
            {/* Recently Used Section */}
            {showRecentlyUsed && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Nemrég használt</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {recentItems.slice(0, 6).map((item, index) => (
                    <button
                      key={item.id}
                      data-index={index}
                      onClick={() => handleItemClick(item.id)}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border text-left transition-all",
                        "hover:border-primary hover:bg-primary/5",
                        highlightedIndex === index && "border-primary bg-primary/5"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{capitalizeFirst(item.name)}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {getCategoryName(item.category_id)}
                        </div>
                      </div>
                      <Plus className="h-4 w-4 text-primary shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search Results */}
            {showSearchResults && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    <span>Találatok: {filteredItems.length}</span>
                  </div>
                  <span className="text-xs">↑↓ navigálás, Enter kiválasztás</span>
                </div>
                
                {filteredItems.length > 0 ? (
                  <ScrollArea className="h-[280px]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pr-4">
                      {filteredItems.slice(0, 50).map((item, index) => (
                        <button
                          key={item.id}
                          data-index={index}
                          onClick={() => handleItemClick(item.id)}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg border text-left transition-all",
                            "hover:border-primary hover:bg-primary/5",
                            highlightedIndex === index && "border-primary bg-primary/5"
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{capitalizeFirst(item.name)}</div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="truncate">{getCategoryName(item.category_id)}</span>
                              <span>•</span>
                              <span>{item.price_huf} Ft</span>
                            </div>
                          </div>
                          <Plus className="h-4 w-4 text-primary shrink-0 ml-2" />
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nincs találat: "{searchTerm}"</p>
                    <p className="text-xs mt-1">Próbálj más keresőszót</p>
                  </div>
                )}
              </div>
            )}

            {/* Empty state when no search, no category filter, and no recent */}
            {!showSearchResults && recentItems.length === 0 && (
              <div className="text-center py-6 text-muted-foreground border border-dashed rounded-lg">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Kezdj el gépelni a kereséshez</p>
                <p className="text-xs mt-1">{availableItems.length} étel elérhető</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default FoodSearchCommand;
