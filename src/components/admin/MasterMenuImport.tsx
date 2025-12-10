import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading";
import { Upload, FileSpreadsheet, Check, AlertCircle, X, ChefHat, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';

interface ParsedItem {
  name: string;
  category: string;
  categoryIndex: number;
}

interface ParsedResult {
  categories: string[];
  items: ParsedItem[];
  totalItems: number;
  itemsPerCategory: Record<string, number>;
}

interface MenuCategory {
  id: string;
  name: string;
  sort: number;
}

const MasterMenuImport = () => {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedResult | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [categories, setCategories] = useState<MenuCategory[]>([]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
      setFile(droppedFile);
      setParsedData(null);
    } else {
      toast({
        title: "Hibás fájltípus",
        description: "Kérjük, Excel fájlt (.xlsx, .xls) töltsön fel",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setParsedData(null);
    }
  };

  const parseExcelFile = (file: File): Promise<ParsedResult> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          
          // Get the first sheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to JSON with header
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
          
          if (jsonData.length === 0) {
            reject(new Error('Empty Excel file'));
            return;
          }

          // First row contains category names
          const categories = jsonData[0].filter(cat => cat && String(cat).trim() !== '');
          
          const items: ParsedItem[] = [];
          const itemsPerCategory: Record<string, number> = {};
          
          // Initialize counts
          categories.forEach(cat => {
            itemsPerCategory[cat] = 0;
          });
          
          // Process each row (starting from row 2)
          for (let rowIndex = 1; rowIndex < jsonData.length; rowIndex++) {
            const row = jsonData[rowIndex];
            if (!row) continue;
            
            for (let colIndex = 0; colIndex < categories.length; colIndex++) {
              const cellValue = row[colIndex];
              if (cellValue && typeof cellValue === 'string' && cellValue.trim() !== '') {
                const itemName = cellValue.trim();
                const category = categories[colIndex];
                
                // Skip if item name looks like a category header (duplicate)
                if (itemName.toLowerCase() === category?.toLowerCase()) continue;
                
                items.push({
                  name: itemName,
                  category: category,
                  categoryIndex: colIndex
                });
                
                if (itemsPerCategory[category] !== undefined) {
                  itemsPerCategory[category]++;
                }
              }
            }
          }

          resolve({
            categories,
            items,
            totalItems: items.length,
            itemsPerCategory
          });
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsBinaryString(file);
    });
  };

  const parseExcel = async () => {
    if (!file) return;

    setParsing(true);
    try {
      // Fetch categories first
      const { data: catData } = await supabase
        .from('menu_categories')
        .select('*')
        .order('sort');
      
      if (catData) setCategories(catData);

      // Parse Excel on client side
      const data = await parseExcelFile(file);
      
      setParsedData(data);
      toast({
        title: "Excel feldolgozva",
        description: `${data.totalItems} étel található ${data.categories.length} kategóriában`
      });
    } catch (error) {
      console.error('Parse error:', error);
      toast({
        title: "Hiba",
        description: "Nem sikerült feldolgozni az Excel fájlt",
        variant: "destructive"
      });
    } finally {
      setParsing(false);
    }
  };

  const findCategoryId = (excelCategory: string): string | null => {
    // Try exact match first
    let cat = categories.find(c => c.name.toLowerCase() === excelCategory.toLowerCase());
    if (cat) return cat.id;

    // Try partial match
    cat = categories.find(c => 
      c.name.toLowerCase().includes(excelCategory.toLowerCase()) ||
      excelCategory.toLowerCase().includes(c.name.toLowerCase())
    );
    if (cat) return cat.id;

    // Map specific Excel categories to DB categories
    const categoryMap: Record<string, string> = {
      'tesztaetelek': 'tészta ételek',
      'foetelek': 'főételek',
      'fozelekek': 'főzelékek'
    };

    const normalized = excelCategory.toLowerCase().replace(/\s+/g, '');
    const mappedName = categoryMap[normalized];
    if (mappedName) {
      cat = categories.find(c => c.name.toLowerCase() === mappedName);
      if (cat) return cat.id;
    }

    return null;
  };

  const importItems = async () => {
    if (!parsedData) return;

    setImporting(true);
    setImportProgress(0);
    setImportedCount(0);
    setSkippedCount(0);

    try {
      // Fetch existing items to avoid duplicates
      const { data: existingItems } = await supabase
        .from('menu_items')
        .select('name');
      
      const existingNames = new Set(
        existingItems?.map(item => item.name.toLowerCase().trim()) || []
      );

      const itemsToInsert: Array<{
        name: string;
        price_huf: number;
        category_id: string | null;
        is_active: boolean;
        is_temporary: boolean;
      }> = [];

      let skipped = 0;

      for (const item of parsedData.items) {
        const normalizedName = item.name.toLowerCase().trim();
        
        if (existingNames.has(normalizedName)) {
          skipped++;
          continue;
        }

        const categoryId = findCategoryId(item.category);
        
        itemsToInsert.push({
          name: item.name,
          price_huf: 0, // Default price, admin will set later
          category_id: categoryId,
          is_active: true,
          is_temporary: false
        });

        existingNames.add(normalizedName); // Avoid duplicates within the same import
      }

      setSkippedCount(skipped);

      // Batch insert in chunks of 50
      const chunkSize = 50;
      let imported = 0;

      for (let i = 0; i < itemsToInsert.length; i += chunkSize) {
        const chunk = itemsToInsert.slice(i, i + chunkSize);
        
        const { error } = await supabase
          .from('menu_items')
          .insert(chunk);

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }

        imported += chunk.length;
        setImportedCount(imported);
        setImportProgress(Math.round((imported / itemsToInsert.length) * 100));
      }

      toast({
        title: "Import sikeres!",
        description: `${imported} új étel hozzáadva, ${skipped} kihagyva (már létezett)`
      });

      // Reset state
      setFile(null);
      setParsedData(null);
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Hiba",
        description: "Nem sikerült importálni az ételeket",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  const resetImport = () => {
    setFile(null);
    setParsedData(null);
    setImportProgress(0);
    setImportedCount(0);
    setSkippedCount(0);
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Master Étel Könyvtár Import
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!file ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">
                Húzza ide az Excel fájlt
              </p>
              <p className="text-muted-foreground mb-4">
                vagy
              </p>
              <label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <Button variant="outline" asChild>
                  <span className="cursor-pointer">Fájl kiválasztása</span>
                </Button>
              </label>
              <p className="text-xs text-muted-foreground mt-4">
                Támogatott formátumok: .xlsx, .xls
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!parsedData && (
                    <Button onClick={parseExcel} disabled={parsing}>
                      {parsing ? (
                        <>
                          <LoadingSpinner className="h-4 w-4 mr-2" />
                          Feldolgozás...
                        </>
                      ) : (
                        <>
                          <Package className="h-4 w-4 mr-2" />
                          Feldolgozás
                        </>
                      )}
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={resetImport}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Section */}
      {parsedData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ChefHat className="h-5 w-5" />
                Előnézet
              </div>
              <Badge variant="secondary" className="text-base">
                {parsedData.totalItems} étel
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Category Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {parsedData.categories.map((cat) => (
                <div key={cat} className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium text-sm truncate">{cat}</p>
                  <p className="text-2xl font-bold text-primary">
                    {parsedData.itemsPerCategory[cat] || 0}
                  </p>
                </div>
              ))}
            </div>

            {/* Items Accordion */}
            <ScrollArea className="h-[400px]">
              <Accordion type="multiple" className="w-full">
                {parsedData.categories.map((cat) => {
                  const categoryItems = parsedData.items.filter(item => item.category === cat);
                  const categoryId = findCategoryId(cat);
                  
                  return (
                    <AccordionItem key={cat} value={cat}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{cat}</span>
                          <Badge variant="outline">{categoryItems.length}</Badge>
                          {categoryId ? (
                            <Badge variant="default" className="text-xs">
                              <Check className="h-3 w-3 mr-1" />
                              Kategória megtalálva
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Ismeretlen kategória
                            </Badge>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pl-4">
                          {categoryItems.slice(0, 20).map((item, idx) => (
                            <div key={idx} className="text-sm py-1 text-muted-foreground">
                              • {item.name}
                            </div>
                          ))}
                          {categoryItems.length > 20 && (
                            <div className="text-sm py-1 text-primary font-medium col-span-full">
                              + további {categoryItems.length - 20} étel...
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </ScrollArea>

            {/* Import Progress */}
            {importing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Importálás folyamatban...</span>
                  <span>{importedCount} / {parsedData.totalItems - skippedCount}</span>
                </div>
                <Progress value={importProgress} className="h-2" />
              </div>
            )}

            {/* Import Button */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={resetImport}>
                Mégse
              </Button>
              <Button onClick={importItems} disabled={importing}>
                {importing ? (
                  <>
                    <LoadingSpinner className="h-4 w-4 mr-2" />
                    Importálás...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    {parsedData.totalItems} étel importálása
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Box */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Hogyan működik:</strong></p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Töltse fel a master étellista Excel fájlt</li>
                <li>A rendszer feldolgozza a kategóriákat és ételeket</li>
                <li>Ellenőrizze az előnézetet és kattintson az "Importálás" gombra</li>
                <li>Az ételek megjelennek a Napi ajánlatok választóban</li>
                <li>Később hozzáadhat árakat és képeket az Étlap menedzsmentben</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MasterMenuImport;
