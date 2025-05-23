import React from 'react';
import { Row, Col, Card, Typography, Tag, Empty, Space } from 'antd';
import moment from 'moment';
import 'moment/locale/fr';

const { Title, Text } = Typography;

// CRA status constants
const CRA_STATUS = {
  A_SAISIR: "À saisir",
  EN_ATTENTE_PRESTATAIRE: "En attente validation prestataire",
  EN_ATTENTE_CLIENT: "En attente validation client",
  VALIDE: "Validé"
};

const CraDetailsView = ({ craEntry }) => {
  if (!craEntry) return <Empty description="Aucune donnée disponible" />;

  // Get period and date
  const period = craEntry.période || '';
  const jour = craEntry.jour || '1';
  const [month, year] = period.split('_');
  const dateStr = jour && month && year ? `${jour}/${month}/${year}` : '-';

  // Get consultant info
  const consultant = craEntry.consultant || {};
  const consultantName = `${consultant.prenom || ''} ${consultant.nom || ''}`;
  
  // Get client and project info
  const client = craEntry.client || {};
  const clientName = client.raison_sociale || '-';
  
  const project = craEntry.project || {};
  const projectName = project.titre || '-';
  
  // Format activity type
  const type = craEntry.type || '';
  const activityType = type === 'travail' ? 'Travail' : 
                      (type ? type.charAt(0).toUpperCase() + type.slice(1) : '-');

  // Handle candidature info
  const candidature = craEntry.candidature || {};

  return (
    <div className="cra-details">
      <Row gutter={[16, 24]}>
        <Col span={24}>
          <Card>
            <Title level={4}>Informations Générales</Title>
            <Row gutter={16}>
              <Col span={12}>
                <div className="info-item">
                  <Text strong>Consultant: </Text>
                  <Text>{consultantName}</Text>
                </div>
                <div className="info-item">
                  <Text strong>Profil: </Text>
                  <Text>{consultant.profil || '-'}</Text>
                </div>
                <div className="info-item">
                  <Text strong>Email: </Text>
                  <Text>{consultant.email || '-'}</Text>
                </div>
              </Col>
              <Col span={12}>
                <div className="info-item">
                  <Text strong>Date: </Text>
                  <Text>{dateStr}</Text>
                </div>
                <div className="info-item">
                  <Text strong>Type d'Activité: </Text>
                  <Text>{activityType}</Text>
                </div>
                <div className="info-item">
                  <Text strong>Durée: </Text>
                  <Text>{craEntry.Durée || '0'} jour(s)</Text>
                </div>
                {craEntry.status && (
                  <div className="info-item">
                    <Text strong>Statut: </Text>
                    <Tag color={
                      craEntry.status === CRA_STATUS.A_SAISIR 
                        ? "blue" 
                        : craEntry.status === CRA_STATUS.EN_ATTENTE_PRESTATAIRE 
                          ? "orange" 
                          : craEntry.status === CRA_STATUS.EN_ATTENTE_CLIENT 
                            ? "purple" 
                            : "green"
                    }>
                      {craEntry.status}
                    </Tag>
                  </div>
                )}
              </Col>
            </Row>
          </Card>
        </Col>

        <Col span={24}>
          <Card>
            <Title level={4}>Informations Client et Projet</Title>
            <Row gutter={16}>
              <Col span={12}>
                <div className="info-item">
                  <Text strong>Client: </Text>
                  <Text>{clientName}</Text>
                </div>
              </Col>
              <Col span={12}>
                <div className="info-item">
                  <Text strong>Projet: </Text>
                  <Text>{projectName}</Text>
                </div>
                {candidature && candidature.tjm && (
                  <div className="info-item">
                    <Text strong>TJM: </Text>
                    <Text>{candidature.tjm} €</Text>
                  </div>
                )}
                {candidature && candidature.statut && (
                  <div className="info-item">
                    <Text strong>Statut Candidature: </Text>
                    <Text>{candidature.statut}</Text>
                  </div>
                )}
                {project && project.date_debut && (
                  <div className="info-item">
                    <Text strong>Période Projet: </Text>
                    <Text>
                      {moment(project.date_debut).format('DD/MM/YYYY')} - {project.date_fin ? moment(project.date_fin).format('DD/MM/YYYY') : 'Non définie'}
                    </Text>
                  </div>
                )}
              </Col>
            </Row>
          </Card>
        </Col>

        {craEntry.commentaire && (
          <Col span={24}>
            <Card>
              <Title level={4}>Commentaire</Title>
              <p>{craEntry.commentaire}</p>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default CraDetailsView;
