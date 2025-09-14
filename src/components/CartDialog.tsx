import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Minus } from "lucide-react";

interface CartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CartDialog = ({ open, onOpenChange }: CartDialogProps) => {
  const navigate = useNavigate();
  const { state: cart, updateQuantity, removeItem } = useCart();

  const handleUpdateCartQuantity = (id: string, change: number) => {
    const item = cart.items.find(item => item.id === id);
    if (item) {
      const newQuantity = item.quantity + change;
      if (newQuantity <= 0) {
        removeItem(id);
      } else {
        updateQuantity(id, newQuantity);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kosár</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {cart.items.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              A kosár üres
            </p>
          ) : (
            <>
              {cart.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b">
                  <div className="flex-1">
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {item.price_huf} Ft / db
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateCartQuantity(item.id, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateCartQuantity(item.id, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Összesen:</span>
                  <span>{cart.total} Ft</span>
                </div>
                <Button 
                  className="w-full mt-4 bg-gradient-to-r from-primary to-primary-glow"
                  onClick={() => {
                    onOpenChange(false);
                    navigate("/checkout");
                  }}
                >
                  Tovább a fizetéshez
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};