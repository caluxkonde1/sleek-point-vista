import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Download, TrendingUp, TrendingDown, DollarSign, ShoppingCart } from "lucide-react";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, subDays } from "date-fns";

interface Transaction {
  id: string;
  transaction_number: string;
  final_amount: number;
  payment_method: string;
  created_at: string;
  customer_name?: string;
}

interface SalesData {
  totalSales: number;
  totalTransactions: number;
  averageOrder: number;
  topPaymentMethod: string;
}

const Reports = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [salesData, setSalesData] = useState<SalesData>({
    totalSales: 0,
    totalTransactions: 0,
    averageOrder: 0,
    topPaymentMethod: ''
  });
  const [dateRange, setDateRange] = useState('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReports();
  }, [dateRange, startDate, endDate]);

  const getDateFilter = () => {
    const now = new Date();
    
    switch (dateRange) {
      case 'today':
        return {
          start: startOfDay(now).toISOString(),
          end: endOfDay(now).toISOString()
        };
      case 'yesterday':
        const yesterday = subDays(now, 1);
        return {
          start: startOfDay(yesterday).toISOString(),
          end: endOfDay(yesterday).toISOString()
        };
      case 'this_month':
        return {
          start: startOfMonth(now).toISOString(),
          end: endOfMonth(now).toISOString()
        };
      case 'last_month':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return {
          start: startOfMonth(lastMonth).toISOString(),
          end: endOfMonth(lastMonth).toISOString()
        };
      case 'custom':
        return {
          start: startDate ? startOfDay(new Date(startDate)).toISOString() : null,
          end: endDate ? endOfDay(new Date(endDate)).toISOString() : null
        };
      default:
        return {
          start: startOfDay(now).toISOString(),
          end: endOfDay(now).toISOString()
        };
    }
  };

  const loadReports = async () => {
    if (!profile?.outlet_id) return;
    
    setLoading(true);
    
    try {
      const dateFilter = getDateFilter();
      
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('outlet_id', profile.outlet_id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (dateFilter.start) {
        query = query.gte('created_at', dateFilter.start);
      }
      if (dateFilter.end) {
        query = query.lte('created_at', dateFilter.end);
      }

      const { data, error } = await query;

      if (error) throw error;

      setTransactions(data || []);
      calculateSalesData(data || []);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast({
        title: "Error",
        description: "Failed to load reports",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateSalesData = (transactions: Transaction[]) => {
    const totalSales = transactions.reduce((sum, t) => sum + t.final_amount, 0);
    const totalTransactions = transactions.length;
    const averageOrder = totalTransactions > 0 ? totalSales / totalTransactions : 0;
    
    const paymentMethods = transactions.reduce((acc, t) => {
      const method = t.payment_method || 'unknown';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topPaymentMethod = Object.entries(paymentMethods)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

    setSalesData({
      totalSales,
      totalTransactions,
      averageOrder,
      topPaymentMethod
    });
  };

  const exportToCSV = () => {
    if (transactions.length === 0) {
      toast({
        title: "No Data",
        description: "No transactions to export",
        variant: "destructive"
      });
      return;
    }

    const headers = ['Transaction Number', 'Date', 'Customer', 'Amount', 'Payment Method'];
    const csvData = transactions.map(t => [
      t.transaction_number,
      format(new Date(t.created_at), 'yyyy-MM-dd HH:mm:ss'),
      t.customer_name || '',
      t.final_amount,
      t.payment_method || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Report exported successfully"
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Sales Reports</h1>
        <Button onClick={exportToCSV} disabled={loading || transactions.length === 0}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Date Range Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Date Range
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div>
              <label className="text-sm font-medium">Period</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="this_month">This Month</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {dateRange === 'custom' && (
              <>
                <div>
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">End Date</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {salesData.totalSales.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesData.totalTransactions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {salesData.averageOrder.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Payment Method</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{salesData.topPaymentMethod}</div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No transactions found for the selected period</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map(transaction => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{transaction.transaction_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(transaction.created_at), 'dd/MM/yyyy HH:mm')}
                    </p>
                    {transaction.customer_name && (
                      <p className="text-sm text-muted-foreground">Customer: {transaction.customer_name}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold">Rp {transaction.final_amount.toLocaleString()}</p>
                    <Badge variant="outline" className="capitalize">
                      {transaction.payment_method}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;