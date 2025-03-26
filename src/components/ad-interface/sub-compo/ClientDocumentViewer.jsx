import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  Button,
  Tag,
  Modal,
  message,
  Tabs,
  Empty,
  Spin,
  Typography,
  Badge,
  Tooltip,
  Divider,
  Space,
} from "antd";
import {
  FilePdfOutlined,
  FileExcelOutlined,
  FileWordOutlined,
  FileImageOutlined,
  FileOutlined,
  DownloadOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { Endponit, token } from "../../../helper/enpoint";

// ClientDocumentViewer component
const ClientDocumentViewer = ({ clientId }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDocument, setActiveDocument] = useState(null);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const { TabPane } = Tabs;
  const { Text, Title } = Typography;

  // Fetch documents for the client
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${Endponit()}/api/getDocumentClient/`,
          {
            headers: {
              Authorization: `${token()}`,
            },
            params: {
              ClientId: clientId,
            },
          }
        );

        if (response) {
          // Transform API data to our document structure based on Doc_clt model
          const formattedDocuments = response.data.data.map((doc) => {
            console.log(doc);
            
            // Extract file extension from the Doc_URL
            const filePathParts = (doc.Doc_URL || "").split(".");
            const extension =
              filePathParts.length > 1 ? filePathParts.pop().toLowerCase() : "";

            // Determine document type based on extension
            let type = "autre";
            if (["pdf"].includes(extension)) type = "document";
            if (["xls", "xlsx", "csv"].includes(extension)) type = "tableur";
            if (["doc", "docx"].includes(extension)) type = "texte";
            if (["jpg", "jpeg", "png", "gif"].includes(extension))
              type = "image";

            return {
              id: doc.ID_DOC_CLT || doc.id,
              name: doc.Titre || "Document sans titre",
              type: type,
              status: doc.Statut || "en attente",
              date: doc.Date_Valid
                ? new Date(doc.Date_Valid).toLocaleDateString()
                : "Non validé",
              url: `${Endponit()}/media/${doc.Doc_URL}`,
              description: doc.Description || "",
              extension: extension,
            };
          });

          setDocuments(formattedDocuments);
        } else {
          setDocuments([]);
        }
      } catch (error) {
        console.error("Error fetching documents:", error);
        message.error("Impossible de charger les documents du client");
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };

    if (clientId) {
      fetchDocuments();
    }
  }, [clientId]);

  // Function to get file icon based on file extension
  const getFileIcon = (doc) => {
    const extension = doc.extension || "";

    switch (extension) {
      case "pdf":
        return <FilePdfOutlined className="text-red-500 text-2xl mr-2" />;
      case "xls":
      case "xlsx":
      case "csv":
        return <FileExcelOutlined className="text-green-500 text-2xl mr-2" />;
      case "doc":
      case "docx":
        return <FileWordOutlined className="text-blue-500 text-2xl mr-2" />;
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return <FileImageOutlined className="text-purple-500 text-2xl mr-2" />;
      default:
        return <FileOutlined className="text-gray-500 text-2xl mr-2" />;
    }
  };

  // Get status badge for documents
  const getStatusBadge = (status) => {
    const statusLower = status.toLowerCase();
    if (statusLower === "validé") {
      return (
        <Tooltip title="Document validé">
          <Badge status="success" text="Validé" />
        </Tooltip>
      );
    } else if (statusLower === "en attente") {
      return (
        <Tooltip title="En attente de validation">
          <Badge status="warning" text="En attente" />
        </Tooltip>
      );
    } else if (statusLower === "rejeté") {
      return (
        <Tooltip title="Document rejeté">
          <Badge status="error" text="Rejeté" />
        </Tooltip>
      );
    } else {
      return (
        <Tooltip title={status}>
          <Badge status="default" text={status} />
        </Tooltip>
      );
    }
  };

  // Function to view document
  const viewDocument = (doc) => {
    setActiveDocument(doc);
    setShowPdfViewer(true);
  };

  // Function to download document
  const downloadDocument = (doc) => {
    try {
      message.success(`Téléchargement de ${doc.name} en cours...`);

      // Create a hidden anchor element to trigger download
      const link = document.createElement("a");
      link.href = doc.url;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download error:", error);
      message.error("Erreur lors du téléchargement du document");
    }
  };

  // Group documents by type and status
  const groupDocumentsByType = () => {
    return documents.reduce((acc, doc) => {
      const type = doc.type || "autre";
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(doc);
      return acc;
    }, {});
  };

  const groupDocumentsByStatus = () => {
    return documents.reduce((acc, doc) => {
      const status = doc.status.toLowerCase();
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(doc);
      return acc;
    }, {});
  };

  // Map document types to French labels
  const getTypeLabel = (type) => {
    const typeMap = {
      document: "Documents PDF",
      tableur: "Tableurs",
      texte: "Documents texte",
      image: "Images",
      autre: "Autres fichiers",
    };
    return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };

  // PDF Viewer Modal
  const renderDocumentViewer = () => {
    if (!activeDocument) return null;

    const isPdf = activeDocument.extension === "pdf";
    const isImage = ["jpg", "jpeg", "png", "gif"].includes(
      activeDocument.extension
    );

    return (
      <Modal
        title={
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {getFileIcon(activeDocument)}
              <span>{activeDocument.name}</span>
            </div>
            <div>{getStatusBadge(activeDocument.status)}</div>
          </div>
        }
        open={showPdfViewer}
        onCancel={() => setShowPdfViewer(false)}
        footer={[
          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => downloadDocument(activeDocument)}
          >
            Télécharger
          </Button>,
          <Button key="close" onClick={() => setShowPdfViewer(false)}>
            Fermer
          </Button>,
        ]}
        width={800}
        bodyStyle={{ height: "70vh", padding: isPdf || isImage ? 0 : 16 }}
      >
        {isPdf ? (
          <iframe
            src={`${activeDocument.url}#toolbar=0`}
            style={{ width: "100%", height: "100%", border: "none" }}
            title={activeDocument.name}
          />
        ) : isImage ? (
          <div className="h-full flex items-center justify-center bg-gray-100">
            <img
              src={activeDocument.url}
              alt={activeDocument.name}
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
              }}
            />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center flex-col p-6">
            <div className="mb-4 text-4xl">{getFileIcon(activeDocument)}</div>
            <p className="text-lg mb-3 font-medium">{activeDocument.name}</p>

            {activeDocument.description && (
              <div className="mb-5 text-center max-w-md">
                <Divider>Description</Divider>
                <p className="text-sm text-gray-600">
                  {activeDocument.description}
                </p>
              </div>
            )}

            <Divider>Informations</Divider>
            <div className="mb-5 text-sm text-gray-500">
              <p>
                <CalendarOutlined className="mr-2" /> Date de validation:{" "}
                {activeDocument.date}
              </p>
              <p>
                <InfoCircleOutlined className="mr-2" /> Type:{" "}
                {getTypeLabel(activeDocument.type)}
              </p>
            </div>

            <p className="text-sm text-gray-500 mb-5">
              Ce type de fichier ne peut pas être prévisualisé directement.
            </p>

            <Button
              type="primary"
              size="large"
              icon={<DownloadOutlined />}
              onClick={() => downloadDocument(activeDocument)}
            >
              Télécharger pour voir
            </Button>
          </div>
        )}
      </Modal>
    );
  };

  // Render document card
  const renderDocumentCard = (doc) => (
    <Card
      key={doc.id}
      size="small"
      hoverable
      className="flex flex-col"
      actions={[
        // <Tooltip title="Voir le document">
        //   <EyeOutlined
        //     key="view"
        //     onClick={(e) => {
        //       e.stopPropagation();
        //       viewDocument(doc);
        //     }}
        //   />
        // </Tooltip>,
        <Tooltip title="Télécharger">
          <DownloadOutlined
            key="download"
            onClick={(e) => {
              e.stopPropagation();
              downloadDocument(doc);
            }}
          />
        </Tooltip>,
      ]}
    >
      <div className="flex items-start">
        {getFileIcon(doc)}
        <div className="truncate flex-1">
          <div className="font-medium truncate mb-1">{doc.name}</div>
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">{doc.date}</div>
            <div>{getStatusBadge(doc.status)}</div>
          </div>
          {doc.description && (
            <Text
              type="secondary"
              ellipsis={{ rows: 1 }}
              className="text-xs mt-1"
            >
              {doc.description}
            </Text>
          )}
        </div>
      </div>
    </Card>
  );

  // Render document list or empty state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spin tip="Chargement des documents..." />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <Empty
        description="Aucun document disponible pour ce client"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  // Organize documents by type and status for tabs
  const documentsByType = groupDocumentsByType();
  const documentsByStatus = groupDocumentsByStatus();

  return (
    <>
      <Tabs
        defaultActiveKey="all"
        type="card"
        size="small"
        className="document-tabs"
      >
        <TabPane
          tab={
            <span>
              <InfoCircleOutlined /> Tous
            </span>
          }
          key="all"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {documents.map((doc) => renderDocumentCard(doc))}
          </div>
        </TabPane>

        {/* Status tabs */}
        {/* {documentsByStatus["validé"] && (
          <TabPane
            tab={
              <span>
                <CheckCircleOutlined className="text-green-500" /> Validés
                <Badge
                  count={documentsByStatus["validé"].length}
                  className="ml-1"
                  style={{ backgroundColor: "#52c41a" }}
                />
              </span>
            }
            key="validated"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {documentsByStatus["validé"].map((doc) =>
                renderDocumentCard(doc)
              )}
            </div>
          </TabPane>
        )} */}

        {documentsByStatus["en attente"] && (
          <TabPane
            tab={
              <span>
                <ClockCircleOutlined className="text-orange-500" /> En attente
                <Badge
                  count={documentsByStatus["en attente"].length}
                  className="ml-1"
                  style={{ backgroundColor: "#faad14" }}
                />
              </span>
            }
            key="pending"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {documentsByStatus["en attente"].map((doc) =>
                renderDocumentCard(doc)
              )}
            </div>
          </TabPane>
        )}

        {documentsByStatus["rejeté"] && (
          <TabPane
            tab={
              <span>
                <ExclamationCircleOutlined className="text-red-500" /> Rejetés
                <Badge
                  count={documentsByStatus["rejeté"].length}
                  className="ml-1"
                  style={{ backgroundColor: "#f5222d" }}
                />
              </span>
            }
            key="rejected"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {documentsByStatus["rejeté"].map((doc) =>
                renderDocumentCard(doc)
              )}
            </div>
          </TabPane>
        )}

        {/* Type tabs */}
        {Object.entries(documentsByType).map(([type, docs]) => (
          <TabPane
            tab={
              <span>
                {type === "document" && (
                  <FilePdfOutlined className="text-red-500" />
                )}
                {type === "tableur" && (
                  <FileExcelOutlined className="text-green-500" />
                )}
                {type === "texte" && (
                  <FileWordOutlined className="text-blue-500" />
                )}
                {type === "image" && (
                  <FileImageOutlined className="text-purple-500" />
                )}
                {type === "autre" && <FileOutlined />} {getTypeLabel(type)}
              </span>
            }
            key={`type-${type}`}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {docs.map((doc) => renderDocumentCard(doc))}
            </div>
          </TabPane>
        ))}
      </Tabs>
      {renderDocumentViewer()}
    </>
  );
};

export default ClientDocumentViewer;
