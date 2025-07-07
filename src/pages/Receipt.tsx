import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Printer } from "lucide-react";
import { format } from "date-fns";

interface Transaction {
  id: string;
  transaction_number: string;
  customer_name: string | null;
  total_amount: number;
  discount_amount: number;
  tax_amount: number;
  final_amount: number;
  payment_method: string | null;
  created_at: string;
  transaction_items: Array<{
    id: string;
    quantity: number;
    price: number;
    total: number;
    products: {
      name: string;
    };
  }>;
  outlets: {
    name: string;
    address: string | null;
    phone: string | null;
  };
}

const Receipt = () => {
  const { transactionId } = useParams<{ transactionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (transactionId) {
      loadTransaction();
    }
  }, [transactionId]);

  const loadTransaction = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          transaction_items (
            *,
            products (name)
          ),
          outlets (name, address, phone)
        `)
        .eq('id', transactionId)
        .single();

      if (error) throw error;
      setTransaction(data);
    } catch (error) {
      console.error('Error loading transaction:', error);
      toast({
        title: "Error",
        description: "Failed to load transaction details",
        variant: "destructive"
      });
      navigate('/pos');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading receipt...</p>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Transaction not found</p>
          <Button onClick={() => navigate('/pos')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to POS
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Screen controls - hidden when printing */}
      <div className="print:hidden mb-6 flex justify-between items-center">
        <Button variant="outline" onClick={() => navigate('/pos')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to POS
        </Button>
        <Button onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" />
          Print Receipt
        </Button>
      </div>

      {/* Receipt content - optimized for printing */}
      <div className="max-w-sm mx-auto bg-white text-black print:shadow-none print:max-w-none">
        <Card className="border-none shadow-none print:shadow-none">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg font-bold">{transaction.outlets.name}</CardTitle>
            {transaction.outlets.address && (
              <p className="text-xs text-muted-foreground">{transaction.outlets.address}</p>
            )}
            {transaction.outlets.phone && (
              <p className="text-xs text-muted-foreground">{transaction.outlets.phone}</p>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="text-center text-xs space-y-1">
              <p><strong>Transaction #:</strong> {transaction.transaction_number}</p>
              <p><strong>Date:</strong> {format(new Date(transaction.created_at), 'dd/MM/yyyy HH:mm:ss')}</p>
              {transaction.customer_name && (
                <p><strong>Customer:</strong> {transaction.customer_name}</p>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              {transaction.transaction_items.map((item) => (
                <div key={item.id} className="flex justify-between text-xs">
                  <div className="flex-1">
                    <p className="font-medium">{item.products.name}</p>
                    <p className="text-muted-foreground">
                      {item.quantity} x Rp {item.price.toLocaleString()}
                    </p>
                  </div>
                  <p className="font-medium">Rp {item.total.toLocaleString()}</p>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>Rp {transaction.total_amount.toLocaleString()}</span>
              </div>
              {transaction.discount_amount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount:</span>
                  <span>-Rp {transaction.discount_amount.toLocaleString()}</span>
                </div>
              )}
              {transaction.tax_amount > 0 && (
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>Rp {transaction.tax_amount.toLocaleString()}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-sm">
                <span>TOTAL:</span>
                <span>Rp {transaction.final_amount.toLocaleString()}</span>
              </div>
            </div>

            {transaction.payment_method && (
              <div className="text-center text-xs">
                <p><strong>Payment Method:</strong> {transaction.payment_method.toUpperCase()}</p>
              </div>
            )}

            <div className="text-center text-xs text-muted-foreground pt-4">
              <p>Thank you for your purchase!</p>
              <p>Please come again</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 5mm;
          }
          body {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default Receipt;