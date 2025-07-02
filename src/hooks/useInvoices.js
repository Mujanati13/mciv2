import { useState, useEffect, useCallback } from 'react';
import InvoiceService from '../services/invoiceService';
import { message } from 'antd';

/**
 * Hook personnalisé pour gérer les factures
 * @param {string} entityType - Type d'entité ('client', 'esn', 'admin')
 * @param {string} entityId - ID de l'entité (optionnel pour admin)
 */
export const useInvoices = (entityType = 'admin', entityId = null) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Récupérer les factures selon le type d'entité
  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      let response;
      
      switch (entityType) {
        case 'client':
          if (!entityId) {
            entityId = localStorage.getItem('id');
          }
          response = await InvoiceService.getInvoicesByClient(entityId);
          break;
          
        case 'esn':
          if (!entityId) {
            entityId = localStorage.getItem('id');
          }
          response = await InvoiceService.getInvoicesByESN(entityId);
          break;
          
        case 'admin':
        default:
          response = await InvoiceService.getAllInvoices();
          break;
      }
      
      setInvoices(response || []);
    } catch (err) {
      setError(err.message);
      message.error('Erreur lors du chargement des factures');
      console.error('Erreur lors du chargement des factures:', err);
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  // Mettre à jour une facture
  const updateInvoice = useCallback(async (invoiceId, updateData) => {
    setLoading(true);
    try {
      await InvoiceService.updateInvoice(invoiceId, updateData);
      message.success('Facture mise à jour avec succès');
      await fetchInvoices(); // Recharger les factures
    } catch (err) {
      setError(err.message);
      message.error('Erreur lors de la mise à jour de la facture');
      console.error('Erreur lors de la mise à jour:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchInvoices]);

  // Supprimer une facture
  const deleteInvoice = useCallback(async (invoiceId) => {
    setLoading(true);
    try {
      await InvoiceService.deleteInvoice(invoiceId);
      message.success('Facture supprimée avec succès');
      await fetchInvoices(); // Recharger les factures
    } catch (err) {
      setError(err.message);
      message.error('Erreur lors de la suppression de la facture');
      console.error('Erreur lors de la suppression:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchInvoices]);

  // Générer des factures après validation CRA
  const generateInvoicesFromCRA = useCallback(async (craData) => {
    setLoading(true);
    try {
      const result = await InvoiceService.generateInvoicesAfterCRAValidation(craData);
      if (result.success) {
        message.success(`${result.factures.length} factures générées avec succès`);
        await fetchInvoices(); // Recharger les factures
        return result;
      } else {
        message.error(result.message);
        return result;
      }
    } catch (err) {
      setError(err.message);
      message.error('Erreur lors de la génération des factures');
      console.error('Erreur lors de la génération:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchInvoices]);

  // Charger les factures au montage du composant
  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Calculer les statistiques
  const statistics = {
    total: invoices.length,
    paid: invoices.filter(inv => inv.statut === 'Payée').length,
    pending: invoices.filter(inv => inv.statut === 'En attente').length,
    cancelled: invoices.filter(inv => inv.statut === 'Annulée').length,
    totalAmount: invoices.reduce((sum, inv) => sum + (inv.montant_ttc || 0), 0),
    paidAmount: invoices
      .filter(inv => inv.statut === 'Payée')
      .reduce((sum, inv) => sum + (inv.montant_ttc || 0), 0),
    pendingAmount: invoices
      .filter(inv => inv.statut === 'En attente')
      .reduce((sum, inv) => sum + (inv.montant_ttc || 0), 0),
  };

  // Si c'est pour l'admin, ajouter des statistiques spécifiques
  if (entityType === 'admin') {
    statistics.clientInvoices = invoices.filter(inv => inv.type_facture === 'MITC_TO_CLIENT').length;
    statistics.esnInvoices = invoices.filter(inv => inv.type_facture === 'ESN_TO_MITC').length;
    statistics.commissionAmount = invoices
      .filter(inv => inv.type_facture === 'ESN_TO_MITC')
      .reduce((sum, inv) => sum + (inv.montant_ttc || 0), 0);
    statistics.clientAmount = invoices
      .filter(inv => inv.type_facture === 'MITC_TO_CLIENT')
      .reduce((sum, inv) => sum + (inv.montant_ttc || 0), 0);
  }

  return {
    invoices,
    loading,
    error,
    statistics,
    fetchInvoices,
    updateInvoice,
    deleteInvoice,
    generateInvoicesFromCRA,
    refresh: fetchInvoices
  };
};

export default useInvoices;
