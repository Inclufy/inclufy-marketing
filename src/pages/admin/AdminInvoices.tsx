// src/pages/admin/AdminInvoices.tsx
// Facturen overzicht

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Receipt,
  RefreshCw,
  Loader2,
  Download,
  CheckCircle,
  Clock,
  AlertTriangle,
  Euro,
} from 'lucide-react';
import api from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';

interface Invoice {
  id: string;
  number: string;
  organization_id: string;
  amount: number;
  status: string;
  due_date: string;
  paid_at: string;
  created_at: string;
}

export default function AdminInvoices() {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    paid: { label: nl ? 'Betaald' : fr ? 'Paye' : 'Paid', color: 'bg-emerald-100 text-emerald-700' },
    pending: { label: nl ? 'Openstaand' : fr ? 'En attente' : 'Pending', color: 'bg-amber-100 text-amber-700' },
    overdue: { label: nl ? 'Achterstallig' : fr ? 'En retard' : 'Overdue', color: 'bg-red-100 text-red-700' },
    draft: { label: nl ? 'Concept' : fr ? 'Brouillon' : 'Draft', color: 'bg-gray-100 text-gray-600' },
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tenant-admin/invoices');
      setInvoices(res.data || []);
    } catch {
      // Table may not exist
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const totalAmount = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const paidAmount = invoices.filter(i => i.status === 'paid').reduce((sum, inv) => sum + (inv.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{nl ? 'Facturen' : fr ? 'Factures' : 'Invoices'}</h1>
          <p className="text-sm text-gray-500">{invoices.length} {nl ? 'facturen' : fr ? 'factures' : 'invoices'}</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" /> {nl ? 'Vernieuwen' : fr ? 'Actualiser' : 'Refresh'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <Euro className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-2xl font-bold">&euro;{totalAmount.toFixed(2)}</p>
              <p className="text-xs text-gray-500">{nl ? 'Totaal gefactureerd' : fr ? 'Total facture' : 'Total invoiced'}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-2xl font-bold">&euro;{paidAmount.toFixed(2)}</p>
              <p className="text-xs text-gray-500">{nl ? 'Betaald' : fr ? 'Paye' : 'Paid'}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-2xl font-bold">&euro;{(totalAmount - paidAmount).toFixed(2)}</p>
              <p className="text-xs text-gray-500">{nl ? 'Openstaand' : fr ? 'En attente' : 'Outstanding'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <Receipt className="h-12 w-12 mb-4 text-gray-300" />
              <p className="text-lg font-medium">{nl ? 'Geen facturen' : fr ? 'Aucune facture' : 'No invoices'}</p>
              <p className="text-sm">{nl ? 'Er zijn nog geen facturen aangemaakt' : fr ? 'Aucune facture n\'a encore ete creee' : 'No invoices have been created yet'}</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">{nl ? 'Nummer' : fr ? 'Numero' : 'Number'}</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">{nl ? 'Bedrag' : fr ? 'Montant' : 'Amount'}</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">{nl ? 'Vervaldatum' : fr ? 'Date d\'echeance' : 'Due Date'}</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">{nl ? 'Acties' : fr ? 'Actions' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const statusConfig = STATUS_CONFIG[inv.status] || STATUS_CONFIG.pending;
                  return (
                    <tr key={inv.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                      <td className="py-3 px-4 font-mono text-sm">{inv.number || inv.id.slice(0, 8)}</td>
                      <td className="py-3 px-4 font-medium">&euro;{(inv.amount || 0).toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <Badge className={`${statusConfig.color} border-0 text-xs`}>{statusConfig.label}</Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {inv.due_date ? new Date(inv.due_date).toLocaleDateString(nl ? 'nl-NL' : fr ? 'fr-FR' : 'en-GB') : '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <Download className="h-4 w-4 text-gray-400" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
