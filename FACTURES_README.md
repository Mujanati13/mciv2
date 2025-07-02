# Système de Gestion de Factures - MAGHREBITCONNECT

## Vue d'ensemble

Le système de gestion de factures automatise la génération de factures après validation des CRA (Compte-Rendu d'Activité) par les clients. Il génère automatiquement deux types de factures :

1. **Facture MITC → Client** : Facturation du client final avec le TJM de vente
2. **Facture Prestataire → MITC** : Commission calculée sur la base d'un pourcentage du TJM initial (8% par défaut)

## Fonctionnalités

### Génération Automatique
- ✅ Génération automatique de factures après validation CRA
- ✅ Calcul automatique des montants HT/TTC avec TVA (20% par défaut)
- ✅ Numérotation automatique des factures
- ✅ Attribution des bonnes entités (client/ESN) selon le type de facture

### Interfaces Utilisateur
- ✅ **Interface Client** : Consultation des factures reçues
- ✅ **Interface ESN** : Consultation des commissions à payer
- ✅ **Interface Admin** : Gestion complète de toutes les factures

### API Intégrée
- ✅ Utilisation de l'API factures existante
- ✅ Endpoints CRUD complets (Create, Read, Update, Delete)
- ✅ Filtrage par ESN et par client

## Architecture

### Structure des fichiers

```
src/
├── services/
│   └── invoiceService.js          # Service principal de gestion des factures
├── hooks/
│   └── useInvoices.js             # Hook personnalisé pour gérer les factures
├── components/
│   ├── cl-interface/
│   │   └── client-invoices.jsx    # Interface factures pour les clients
│   ├── en-interface/
│   │   └── esn-invoices.jsx       # Interface factures pour les ESN
│   └── ad-interface/
│       └── admin-invoices.jsx     # Interface admin pour toutes les factures
└── pages/
    ├── interfaceClient.jsx        # Page client avec menu "Mes Factures"
    ├── interfaceEn.jsx            # Page ESN avec menu "Mes Factures"
    └── interfaceAd.jsx            # Page admin avec "Gestion des Factures"
```

### Service principal (`invoiceService.js`)

```javascript
class InvoiceService {
  // Génération automatique après validation CRA
  static async generateInvoicesAfterCRAValidation(craData)
  
  // CRUD Operations
  static async createInvoice(invoiceData)
  static async getAllInvoices()
  static async getInvoicesByESN(esnId)
  static async getInvoicesByClient(clientId)
  static async updateInvoice(invoiceId, updateData)
  static async deleteInvoice(invoiceId)
  
  // Utilitaires
  static calculateHT(montantTTC, tauxTVA = 20)
  static calculateTTC(montantHT, tauxTVA = 20)
  static getStatusTag(status)
  static generateInvoiceNumber(type = 'MITC')
}
```

## Utilisation

### 1. Génération automatique après validation CRA

Quand un client valide un CRA, les factures sont automatiquement générées :

```javascript
// Dans ClientCraValidation.jsx
import InvoiceService from '../../services/invoiceService';

// Après validation du CRA
const craDataForInvoice = {
  consultant: selectedCra.consultant,
  esn: selectedCra.consultant?.esn,
  client: { id: parseInt(clientId) },
  periode: selectedCra.période,
  tjm: selectedCra.tjm || 500,
  jours_travailles: parseFloat(selectedCra.Durée) || 1,
  bdc_id: selectedCra.id_bdc
};

const invoiceResult = await InvoiceService.generateInvoicesAfterCRAValidation(craDataForInvoice);
```

### 2. Consultation des factures

#### Interface Client
- Menu "Mes Factures" accessible dans la section "Gestion Commerciale"
- Affichage des factures avec filtres par statut, date, période
- Détails complets de chaque facture

#### Interface ESN
- Menu "Mes Factures" dans la section "Gestion Commerciale" 
- Séparation entre factures clients et commissions MITC
- Statistiques des commissions dues

#### Interface Admin
- Menu "Gestion des Factures" principal
- Vue d'ensemble de toutes les factures
- Modification des statuts et montants
- Statistiques globales

### 3. Utilisation du hook personnalisé

```javascript
import useInvoices from '../hooks/useInvoices';

// Dans un composant React
const MyComponent = () => {
  const { 
    invoices, 
    loading, 
    statistics, 
    updateInvoice, 
    generateInvoicesFromCRA 
  } = useInvoices('client'); // 'client', 'esn', ou 'admin'

  // Les factures sont automatiquement chargées
  // Utiliser updateInvoice() pour modifier une facture
  // Utiliser generateInvoicesFromCRA() pour créer des factures depuis un CRA
};
```

## Types de Factures

### Facture MITC → Client
- **Type** : `MITC_TO_CLIENT`
- **Destinataire** : Client final
- **Montant** : TJM × Jours travaillés + commission MITC
- **Description** : Prestation consultant avec détails

### Facture ESN → MITC (Commission)
- **Type** : `ESN_TO_MITC`
- **Destinataire** : MITC
- **Montant** : 8% du montant prestataire
- **Description** : Commission sur prestation

## Statuts des Factures

- **En attente** : Facture générée, en attente de paiement
- **Payée** : Facture réglée
- **Annulée** : Facture annulée
- **Brouillon** : Facture en cours de création

## API Endpoints Utilisés

```
GET /api/factures/                    # Toutes les factures
GET /api/factures/{id}/               # Facture spécifique
GET /api/factures/?id_esn={id_esn}    # Factures par ESN
GET /api/factures/?id_client={id_client} # Factures par client
POST /api/factures/                   # Créer une facture
PUT /api/factures/{id}/               # Modifier une facture
DELETE /api/factures/{id}/            # Supprimer une facture
```

## Configuration

### Commission par défaut
La commission MITC est configurée à 8% dans `invoiceService.js` :

```javascript
const commissionPercentage = 8; // 8% de commission pour MITC
```

### TVA par défaut
Le taux de TVA est configuré à 20% :

```javascript
taux_tva: 20.0
```

## Sécurité

- ✅ Authentification par token JWT
- ✅ Autorisation basée sur les rôles (client/ESN/admin)
- ✅ Validation des données d'entrée
- ✅ Filtrage des factures selon l'utilisateur connecté

## Extensions futures

### Fonctionnalités planifiées
- [ ] Génération de PDF des factures
- [ ] Envoi automatique par email
- [ ] Relances de paiement automatiques
- [ ] Export comptable (CSV, Excel)
- [ ] Notifications de nouveaux paiements
- [ ] Historique des modifications
- [ ] Intégration avec un système de paiement

### Améliorations possibles
- [ ] Configuration dynamique des taux de commission
- [ ] Multi-devises
- [ ] Factures récurrentes
- [ ] Workflows d'approbation
- [ ] Rapports avancés et analytics

## Maintenance

### Tests recommandés
1. Test de génération automatique après validation CRA
2. Test des calculs HT/TTC avec différents taux de TVA
3. Test des filtres et recherches dans les interfaces
4. Test des permissions d'accès selon les rôles

### Monitoring
- Surveiller les erreurs de génération de factures
- Vérifier la cohérence des montants calculés
- Contrôler les performances des requêtes de factures

## Support

Pour toute question ou problème concernant le système de factures, contactez l'équipe de développement ou consultez la documentation technique détaillée.
