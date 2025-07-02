import axios from 'axios';
import { Endponit } from '../helper/enpoint';

// Service pour la gestion des factures
export class InvoiceService {
  static token = () => localStorage.getItem('token');
  static getEndpoint = () => Endponit();

  // Générer automatiquement les factures après validation CRA
  static async generateInvoicesAfterCRAValidation(craData) {
    try {
      const { consultant, esn, client, periode, montant_total, tjm, jours_travailles, selectedCra } = craData;
      
      // Générer un ID unique pour lier les deux factures
      const batchId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
      
        // Calculer le montant total basé sur le TJM et les jours travaillés
      const montantPrestataire = tjm * jours_travailles;
      
      console.log('Calcul du montant prestataire:', {
        tjm: tjm,
        jours_travailles: jours_travailles,
        montantPrestataire: montantPrestataire,
        batchId: batchId
      });
        // Calculer le pourcentage de commission (défaut 8% pour MITC)
      const commissionPercentage = 8; // 8% de commission pour MITC
      const commissionMITC = (montantPrestataire * commissionPercentage) / 100;
      const montantClient = montantPrestataire + commissionMITC;
      
      console.log('Calcul des montants factures:', {
        montantPrestataire: montantPrestataire,
        commissionMITC: commissionMITC,
        montantClient: montantClient
      });
      
      // Générer les deux factures avec le même batch ID
      const factures = await Promise.all([
        // Facture 1: MITC → Client final (montant total incluant commission)
        this.createInvoice({
          id_esn: null, // MITC n'est pas une ESN
          id_client: client.id,
          bdc_id: craData.bdc_id || null,
          date_emission: new Date().toISOString().split('T')[0],
          montant_ht: montantPrestataire,
          montant_ttc: montantPrestataire,
          taux_tva: 20.0,
          statut: "En attente",
          type_facture: `MITC_TO_CLIENT_${batchId}`,
          periode: periode,
          consultant_id: consultant.id,
        }),

        // Facture 2: Prestataire → MITC (montant prestataire sans commission)
        this.createInvoice({
          id_esn: null,
          id_client: null, // MITC reçoit la facture
          bdc_id: craData.bdc_id || null,
          date_emission: new Date().toISOString().split('T')[0],
          montant_ht: this.calculateHT(montantPrestataire-commissionPercentage),
          montant_ttc: (montantPrestataire-commissionPercentage),
          taux_tva: 20.0,
          statut: "En attente",
          type_facture: `ESN_TO_MITC_${batchId}`,
          periode: periode,
          consultant_id: consultant.id,
        })
      ]);

      return {
        success: true,
        factures: factures,
        message: 'Factures générées avec succès'
      };

    } catch (error) {
      console.error('Erreur lors de la génération des factures:', error);
      return {
        success: false,
        error: error.message,
        message: 'Erreur lors de la génération des factures'
      };
    }
  }

  // Générer automatiquement les factures après validation NDF
  static async generateInvoicesAfterNDFValidation(ndfData) {
    try {
      const { consultant, esn, client, periode, montant_total, expenses, selectedNdf , montant_ht ,montant_ttc} = ndfData;
      
      // Générer un ID unique pour lier les deux factures
      const batchId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
      
      // Calculer le montant total des frais
      const totalExpenseAmount = expenses.reduce((sum, expense) => sum + (parseFloat(expense.montant) || 0), 0);
      
      console.log('Calcul du montant NDF:', {
        totalExpenseAmount: totalExpenseAmount,
        montant_total: montant_total,
        batchId: batchId
      });
        
      // Calculer le pourcentage de commission pour les frais (défaut 5% pour MITC)
      const commissionPercentage = 5; // 5% de commission pour les frais
      const commissionMITC = (totalExpenseAmount * commissionPercentage) / 100;
      const montantClient = totalExpenseAmount + commissionMITC;
      
      console.log('Calcul des montants factures NDF:', {
        totalExpenseAmount: totalExpenseAmount,
        commissionMITC: commissionMITC,
        montantClient: montantClient
      });
      
      // Générer les deux factures pour les frais avec le même batch ID
      const factures = await Promise.all([
        // Facture 1: MITC → Client final (montant frais + commission)
        this.createInvoice({
          id_esn: esn ? esn.id : null,
          id_client: client.id,
          bdc_id: ndfData.bdc_id || null,
          date_emission: new Date().toISOString().split('T')[0],
          montant_ht: montant_ht,
          montant_ttc: montant_ttc,
          taux_tva: 20.0,
          statut: "En attente",
          type_facture: `MITC_TO_CLIENT_NDF_${batchId}`,
          periode: periode,
          consultant_id: consultant.id,
          description: `Note de frais - Période ${periode}`,
        }),

        // Facture 2: ESN/Consultant → MITC (remboursement des frais)
        this.createInvoice({
          id_esn: esn ? esn.id : null,
          id_client: null,
          bdc_id: ndfData.bdc_id || null,
          date_emission: new Date().toISOString().split('T')[0],
          montant_ht: montant_ht,
          montant_ttc: montant_ttc,
          taux_tva: 20.0,
          statut: "En attente",
          type_facture: `ESN_TO_MITC_NDF_${batchId}`,
          periode: periode,
          consultant_id: consultant.id,
          description: `Remboursement frais - Période ${periode}`,
        })
      ]);

      return {
        success: true,
        factures: factures,
        message: 'Factures NDF générées avec succès'
      };

    } catch (error) {
      console.error('Erreur lors de la génération des factures NDF:', error);
      return {
        success: false,
        error: error.message,
        message: 'Erreur lors de la génération des factures NDF'
      };
    }
  }

  // Créer une facture via l'API
  static async createInvoice(invoiceData) {
    try {
      const response = await axios.post(
        `${Endponit()}/api/factures/`,
        invoiceData,
        {
          headers: {
            'Authorization': `Bearer ${this.token()}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de la facture:', error);
      throw error;
    }
  }  // Récupérer toutes les factures
  static async getAllInvoices() {
    try {
      const response = await axios.get(
        `${Endponit()}/api/factures/`,
        {
          headers: {
            'Authorization': `Bearer ${this.token()}`
          }
        }
      );

      // Gérer la structure de réponse de l'API
      const responseData = response.data;
      
      if (responseData && responseData.success && Array.isArray(responseData.data)) {
        return responseData.data;
      } else if (Array.isArray(responseData)) {
        return responseData;
      } else if (responseData && Array.isArray(responseData.results)) {
        return responseData.results;
      }
      
      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération des factures:', error);
      return [];
    }
  }

  // Récupérer les factures par ESN
  static async getInvoicesByESN(esnId) {
    try {
      const response = await axios.get(
        `${Endponit()}/api/factures/?id_esn=${esnId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.token()}`
          }
        }
      );

      // Gérer la structure de réponse de l'API
      const responseData = response.data;
      
      if (responseData && responseData.success && Array.isArray(responseData.data)) {
        return responseData.data;
      } else if (Array.isArray(responseData)) {
        return responseData;
      } else if (responseData && Array.isArray(responseData.results)) {
        return responseData.results;
      }
      
      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération des factures ESN:', error);
      return [];
    }
  }  // Récupérer les factures par client
  static async getInvoicesByClient(clientId) {
    try {
      const response = await axios.get(
        `${Endponit()}/api/factures/?id_client=${clientId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.token()}`
          }
        }
      );

      // Gérer la structure de réponse de l'API
      const responseData = response.data;
      
      if (responseData && responseData.success && Array.isArray(responseData.data)) {
        return responseData.data;
      } else if (Array.isArray(responseData)) {
        return responseData;
      } else if (responseData && Array.isArray(responseData.results)) {
        return responseData.results;
      }
      
      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération des factures client:', error);
      return []; // Retourner un tableau vide en cas d'erreur
    }
  }

  // Récupérer une facture spécifique
  static async getInvoiceById(invoiceId) {
    try {
      const response = await axios.get(
        `${Endponit()}/api/factures/${invoiceId}/`,
        {
          headers: {
            'Authorization': `Bearer ${this.token()}`
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de la facture:', error);
      throw error;
    }
  }

  // Mettre à jour une facture
  static async updateInvoice(invoiceId, updateData) {
    try {
      const response = await axios.put(
        `${Endponit()}/api/factures/${invoiceId}/`,
        updateData,
        {
          headers: {
            'Authorization': `Bearer ${this.token()}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la facture:', error);
      throw error;
    }
  }

  // Supprimer une facture
  static async deleteInvoice(invoiceId) {
    try {
      const response = await axios.delete(
        `${Endponit()}/api/factures/${invoiceId}/`,
        {
          headers: {
            'Authorization': `Bearer ${this.token()}`
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression de la facture:', error);
      throw error;
    }
  }

  // Calculer le montant HT à partir du TTC
  static calculateHT(montantTTC, tauxTVA = 20) {
    return parseFloat((montantTTC / (1 + tauxTVA / 100)).toFixed(2));  }

  // Calculer le montant TTC à partir du HT
  static calculateTTC(montantHT, tauxTVA = 20) {
    return parseFloat((montantHT * (1 + tauxTVA / 100)).toFixed(2));
  }

  // Formater le statut des factures
  static getStatusTag(status) {
    const statusConfig = {
      'En attente': { color: 'orange', text: 'En attente' },
      'Payée': { color: 'green', text: 'Payée' },
      'Acceptée': { color: 'blue', text: 'Acceptée' },
      'Rejetée': { color: 'red', text: 'Rejetée' },
      'Reçue': { color: 'cyan', text: 'Reçue' },
      'Contestée': { color: 'magenta', text: 'Contestée' },
      'Annulée': { color: 'red', text: 'Annulée' },
      'Brouillon': { color: 'default', text: 'Brouillon' }
    };

    return statusConfig[status] || { color: 'default', text: status };
  }
  // Générer le numéro de facture
  static generateInvoiceNumber(type = 'MITC') {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const timestamp = now.getTime().toString().slice(-6);
    
    return `${type}-${year}${month}-${timestamp}`;
  }
  // Upload document using saveDoc API
  static async uploadDocument(formData) {
    try {
      const response = await fetch(`${Endponit()}/api/saveDoc/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token()}`
        },
        body: formData
      });

      const data = await response.json();
      return data; // Returns { status: true/false, path: "...", msg: "..." }
    } catch (error) {
      console.error('Erreur lors de l\'upload du document:', error);
      return {
        status: false,
        msg: 'Erreur lors de l\'upload du document'
      };
    }
  }

  // Mettre à jour une facture avec le chemin du fichier et le nouveau statut
  static async updateInvoiceWithAttachment(invoiceId, attachmentPath, newStatus) {
    try {
      const response = await axios.put(
        `${Endponit()}/api/factures/${invoiceId}/`,
        { 
          statut: newStatus,
          attachment: attachmentPath
        },
        {
          headers: {
            'Authorization': `Bearer ${this.token()}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data,
        message: 'Facture mise à jour avec succès'
      };
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la facture:', error);
      return {
        success: false,
        error: error.response?.data || error.message,
        message: 'Erreur lors de la mise à jour de la facture'
      };
    }
  }

  // Upload justificatif de paiement (deprecated - use uploadDocument instead)
  static async uploadPaymentReceipt(formData) {
    try {
      const response = await axios.post(
        `${Endponit()}/api/saveDoc`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.token()}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      return {
        success: true,
        data: response.data,
        message: 'Justificatif uploadé avec succès'
      };
    } catch (error) {
      console.error('Erreur lors de l\'upload du justificatif:', error);
      return {
        success: false,
        error: error.response?.data || error.message,
        message: 'Erreur lors de l\'upload du justificatif'
      };
    }
  }
  // Mettre à jour le statut d'une facture
  static async updateInvoiceStatus(invoiceId, newStatus) {
    try {
      const response = await axios.put(
        `${Endponit()}/api/factures/${invoiceId}/`,
        { statut: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${this.token()}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data,
        message: 'Statut mis à jour avec succès'
      };
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      return {
        success: false,
        error: error.response?.data || error.message,
        message: 'Erreur lors de la mise à jour du statut'
      };
    }
  }

  // Mettre à jour le statut d'une facture et effacer l'attachment si rejetée
  static async updateInvoiceStatusWithAttachmentReset(invoiceId, newStatus) {
    try {
      const updateData = { statut: newStatus };
      
      // Si le statut est "Rejetée", effacer l'attachment pour permettre un nouveau téléchargement
      if (newStatus === "Rejetée") {
        updateData.attachment = null;
      }

      const response = await axios.put(
        `${Endponit()}/api/factures/${invoiceId}/`,
        updateData,
        {
          headers: {
            'Authorization': `Bearer ${this.token()}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data,
        message: 'Statut mis à jour avec succès'
      };
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      return {
        success: false,
        error: error.response?.data || error.message,
        message: 'Erreur lors de la mise à jour du statut'
      };
    }
  }
}

export default InvoiceService;
