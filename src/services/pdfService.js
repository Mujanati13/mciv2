import jsPDF from 'jspdf';
import 'jspdf-autotable';

class PDFService {
  // Company information
  static companyInfo = {
    name: "MAGHREB CONNECT IT",
    address: "Adresse de MAGHREB CONNECT IT",
    city: "Ville, CP",
    phone: "0606060606",
    email: "contact@maghrebconnect.it",
    website: "www.maghrebconnect.it"
  };

  // Generate invoice PDF based on user role
  static generateInvoicePDF(invoice, userRole, clientInfo = null, esnInfo = null, consultantInfo = null) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Header with company info and invoice number
    this.addHeader(doc, pageWidth, invoice);

    // Client/ESN information based on role
    this.addPartyInfo(doc, invoice, userRole, clientInfo, esnInfo);

    // Invoice details table
    this.addInvoiceTable(doc, invoice, userRole, consultantInfo);

    // Footer with totals
    this.addFooter(doc, pageWidth, pageHeight, invoice);

    // Terms and conditions
    this.addTermsAndConditions(doc, pageHeight);

    return doc;
  }

  // Add header with company logo and invoice info
  static addHeader(doc, pageWidth, invoice) {
    // Company name and info (left side)
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(this.companyInfo.name, 20, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(this.companyInfo.address, 20, 35);
    doc.text(this.companyInfo.city, 20, 42);
    doc.text(`Tél: ${this.companyInfo.phone}`, 20, 49);
    doc.text(`Email: ${this.companyInfo.email}`, 20, 56);

    // Invoice number box (right side)
    const boxWidth = 80;
    const boxHeight = 40;
    const boxX = pageWidth - boxWidth - 20;
    const boxY = 20;

    // Draw box
    doc.setDrawColor(150, 150, 150);
    doc.rect(boxX, boxY, boxWidth, boxHeight);

    // Invoice header
    doc.setFillColor(230, 230, 250);
    doc.rect(boxX, boxY, boxWidth, 15, 'F');
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('F A C T U R E', boxX + boxWidth/2, boxY + 10, { align: 'center' });

    // Invoice details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`n°: FAC-${String(invoice.id_facture).padStart(6, '0')}`, boxX + 5, boxY + 25);
    doc.text(`Date: ${this.formatDate(invoice.date_emission || new Date())}`, boxX + 5, boxY + 35);
  }

  // Add client or ESN information based on role
  static addPartyInfo(doc, invoice, userRole, clientInfo, esnInfo) {
    let partyTitle = '';
    let partyDetails = '';

    if (userRole === 'client' || invoice.type_facture.includes('MITC_TO_CLIENT')) {
      partyTitle = 'Société et/ou Nom du client';
      partyDetails = clientInfo ? 
        `${clientInfo.nom || 'Client'}\n${clientInfo.adresse || 'Adresse du client'}\n${clientInfo.ville || 'Ville'}` :
        `Client #${invoice.id_client}\nAdresse du client\nVille`;
    } else if (userRole === 'esn' || invoice.type_facture.includes('ESN_TO_MITC')) {
      partyTitle = 'Société ESN';
      partyDetails = esnInfo ? 
        `${esnInfo.nom || 'ESN'}\n${esnInfo.adresse || 'Adresse de l\'ESN'}\n${esnInfo.ville || 'Ville'}` :
        `ESN #${invoice.id_esn}\nAdresse de l'ESN\nVille`;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(partyTitle, 20, 85);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const lines = partyDetails.split('\n');
    lines.forEach((line, index) => {
      doc.text(line, 20, 95 + (index * 7));
    });
  }

  // Add invoice table with items
  static addInvoiceTable(doc, invoice, userRole, consultantInfo) {
    const startY = 130;
    
    // Table title
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Intitulé : description du projet et/ou Produits', 20, startY);

    // Prepare table data
    const tableData = this.prepareTableData(invoice, userRole, consultantInfo);

    // Table configuration
    const tableConfig = {
      startY: startY + 10,
      head: [['Qté', 'Désignation', 'Tva', 'Prix Unit.', 'Total HT']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [220, 220, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold'
      },
      styles: { 
        fontSize: 10,
        cellPadding: 5
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 20 },
        1: { halign: 'left', cellWidth: 80 },
        2: { halign: 'center', cellWidth: 20 },
        3: { halign: 'right', cellWidth: 25 },
        4: { halign: 'right', cellWidth: 25 }
      }
    };

    doc.autoTable(tableConfig);
  }

  // Prepare table data based on invoice type and user role
  static prepareTableData(invoice, userRole, consultantInfo) {
    let description = '';
    
    if (invoice.type_facture.includes('MITC_TO_CLIENT') && !invoice.type_facture.includes('NDF')) {
      description = consultantInfo ? 
        `Mission de conseil - ${consultantInfo.nom || 'Consultant'} - ${invoice.periode}` :
        `Mission de conseil - Période: ${invoice.periode}`;
    } else if (invoice.type_facture.includes('MITC_TO_CLIENT') && invoice.type_facture.includes('NDF')) {
      description = consultantInfo ? 
        `Note de frais - ${consultantInfo.nom || 'Consultant'} - ${invoice.periode}` :
        `Note de frais - Période: ${invoice.periode}`;
    } else if (invoice.type_facture.includes('ESN_TO_MITC') && !invoice.type_facture.includes('NDF')) {
      description = `Commission ESN - Période: ${invoice.periode}`;
    } else if (invoice.type_facture.includes('ESN_TO_MITC') && invoice.type_facture.includes('NDF')) {
      description = `Commission ESN Note de frais - Période: ${invoice.periode}`;
    }

    return [
      [
        '1',
        description,
        `${invoice.taux_tva || 20}%`,
        `${this.formatAmount(invoice.montant_ht)} €`,
        `${this.formatAmount(invoice.montant_ht)} €`
      ]
    ];
  }

  // Add footer with totals
  static addFooter(doc, pageWidth, pageHeight, invoice) {
    const footerY = pageHeight - 80;
    
    // Totals section
    const totalsX = pageWidth - 80;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Total HT
    doc.text('Total HT', totalsX - 30, footerY);
    doc.text(`${this.formatAmount(invoice.montant_ht)} €`, totalsX + 10, footerY, { align: 'right' });
    
    // TVA
    const tvaAmount = (parseFloat(invoice.montant_ttc) || 0) - (parseFloat(invoice.montant_ht) || 0);
    doc.text(`Tva (${invoice.taux_tva || 20}%)`, totalsX - 30, footerY + 10);
    doc.text(`${this.formatAmount(tvaAmount)} €`, totalsX + 10, footerY + 10, { align: 'right' });
    
    // Total TTC
    doc.setFont('helvetica', 'bold');
    doc.text('Total TTC', totalsX - 30, footerY + 25);
    doc.text(`${this.formatAmount(invoice.montant_ttc)} €`, totalsX + 10, footerY + 25, { align: 'right' });

    // Payment terms
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('En votre aimable règlement', 20, footerY + 10);
    doc.text('Cordialement,', 20, footerY + 20);
  }

  // Add terms and conditions
  static addTermsAndConditions(doc, pageHeight) {
    const termsY = pageHeight - 50;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    
    const terms = [
      'Conditions de règlement : paiement à réception de facture',
      'Aucun escompte consenti pour règlement anticipé',
      'Tout incident de paiement est passible d\'intérêt de retard. Le montant des pénalités résulte de',
      'l\'application aux sommes restant dues d\'un taux d\'intérêt légal en vigueur au moment de l\'incident.',
      'Indemnité forfaitaire pour frais de recouvrement due au créancier en cas de retard de paiement: 40€'
    ];

    terms.forEach((term, index) => {
      doc.text(term, 20, termsY + (index * 4));
    });

    // Company registration info
    doc.setFontSize(7);
  }

  // Download PDF for specific party
  static downloadInvoicePDF(invoice, userRole, additionalInfo = {}) {
    try {
      const doc = this.generateInvoicePDF(
        invoice, 
        userRole, 
        additionalInfo.clientInfo,
        additionalInfo.esnInfo,
        additionalInfo.consultantInfo
      );

      const fileName = `Facture_${String(invoice.id_facture).padStart(6, '0')}_${userRole}.pdf`;
      doc.save(fileName);
      
      return { success: true, message: 'PDF généré avec succès' };
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      return { success: false, message: 'Erreur lors de la génération du PDF' };
    }
  }

  // Utility functions
  static formatAmount(amount) {
    const numAmount = parseFloat(amount) || 0;
    return numAmount.toFixed(2);
  }

  static formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  // Check if download is allowed based on status and user role
  static isDownloadAllowed(invoice, userRole) {
    if (userRole === 'admin') {
      return true; // Admin can always download
    }
    
    if (userRole === 'client' && invoice.type_facture.includes('MITC_TO_CLIENT')) {
      return ['Payée', 'Acceptée', 'Reçue'].includes(invoice.statut);
    }
    
    if (userRole === 'esn' && invoice.type_facture.includes('ESN_TO_MITC')) {
      return ['Payée', 'Reçue'].includes(invoice.statut);
    }
    
    return false;
  }
}

export default PDFService;
