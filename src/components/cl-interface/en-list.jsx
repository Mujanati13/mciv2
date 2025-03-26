// import React, { useState } from 'react';
// import {
//     Card,
//     List,
//     Tag,
//     Input,
//     Select,
//     Row,
//     Col,
//     Button,
//     Rate,
//     Modal,
//     Drawer,
//     Typography,
//     Space,
//     Divider,
//     Badge
// } from 'antd';
// import {
//     SearchOutlined,
//     EnvironmentOutlined,
//     PhoneOutlined,
//     MailOutlined,
//     GlobalOutlined,
//     EyeOutlined,
//     StarFilled,
//     ClockCircleOutlined,
//     FilterOutlined,
//     CloseOutlined
// } from '@ant-design/icons';

// const { Title, Text, Paragraph } = Typography;
// const { Option } = Select;
// const { Meta } = Card;

// const EntrepriseServices = () => {
//     const [searchText, setSearchText] = useState('');
//     const [selectedSpecialite, setSelectedSpecialite] = useState('');
//     const [detailsVisible, setDetailsVisible] = useState(false);
//     const [selectedEntreprise, setSelectedEntreprise] = useState(null);
//     const [contactModalVisible, setContactModalVisible] = useState(false);
//     const [isSearchVisible, setIsSearchVisible] = useState(false);

//     // Example data remains the same
//     const entreprises = [
//         {
//             id: 1,
//             nom: "Tech Solutions Pro",
//             specialites: ["Développement Web", "Applications Mobiles"],
//             description: "Expert en solutions numériques personnalisées pour les entreprises.",
//             adresse: "15 Rue de la République, Paris",
//             telephone: "+33 1 23 45 67 89",
//             email: "contact@techsolutions.fr",
//             site: "www.techsolutions.fr",
//             rating: 4.5,
//             images: ["https://www.pngall.com/wp-content/uploads/13/AWS-Logo-PNG-Images.png"],
//             horaires: {
//                 lundi: "9h-18h",
//                 mardi: "9h-18h",
//                 mercredi: "9h-18h",
//                 jeudi: "9h-18h",
//                 vendredi: "9h-17h"
//             },
//             services: [
//                 "Développement sur mesure",
//                 "Maintenance applicative",
//                 "Conseil technique"
//             ],
//             avis: [
//                 {
//                     client: "Marie D.",
//                     commentaire: "Excellent service, très professionnel",
//                     note: 5
//                 }
//             ]
//         },
//         {
//             id: 2,
//             nom: "Clean & Net",
//             specialites: ["Nettoyage Industriel", "Entretien Bureaux"],
//             description: "Services de nettoyage professionnel pour entreprises et particuliers.",
//             adresse: "25 Avenue des Champs-Élysées, Paris",
//             telephone: "+33 1 98 76 54 32",
//             email: "contact@cleannet.fr",
//             site: "www.cleannet.fr",
//             rating: 4.2,
//             images: ["https://www.pngall.com/wp-content/uploads/13/AWS-Logo-PNG-Images.png"],
//             horaires: {
//                 lundi: "7h-19h",
//                 mardi: "7h-19h",
//                 mercredi: "7h-19h",
//                 jeudi: "7h-19h",
//                 vendredi: "7h-19h"
//             },
//             services: [
//                 "Nettoyage quotidien",
//                 "Nettoyage vitres",
//                 "Désinfection"
//             ],
//             avis: [
//                 {
//                     client: "Pierre L.",
//                     commentaire: "Service rapide et efficace",
//                     note: 4
//                 }
//             ]
//         }
//     ];

//     const specialites = [
//         "Développement Web",
//         "Applications Mobiles",
//         "Nettoyage Industriel",
//         "Entretien Bureaux",
//         "Conseil",
//         "Formation"
//     ];

//     // Handler functions remain the same
//     const handleSearch = (value) => {
//         setSearchText(value.toLowerCase().trim());
//     };

//     const handleSpecialiteChange = (value) => {
//         setSelectedSpecialite(value);
//     };

//     const showDetails = (entreprise) => {
//         setSelectedEntreprise(entreprise);
//         setDetailsVisible(true);
//     };

//     const filteredEntreprises = entreprises.filter(entreprise => {
//         const matchSearch = searchText === '' || 
//             entreprise.nom.toLowerCase().includes(searchText) ||
//             entreprise.description.toLowerCase().includes(searchText) ||
//             entreprise.specialites.some(spec => spec.toLowerCase().includes(searchText));
        
//         const matchSpecialite = !selectedSpecialite ||
//             entreprise.specialites.includes(selectedSpecialite);
        
//         return matchSearch && matchSpecialite;
//     });

//     const DetailsDrawer = () => (
//         <Drawer
//             title={
//                 <div className="flex items-center justify-between w-full border-b pb-4 mt-2">
//                     <div className="flex items-center space-x-4">
//                         <img
//                             src={selectedEntreprise?.images[0]}
//                             alt={selectedEntreprise?.nom}
//                             className="w-12 h-12 object-contain rounded"
//                         />
//                         <div>
//                             <h1 className="text-xl font-semibold text-gray-800">
//                                 {selectedEntreprise?.nom}
//                             </h1>
//                             <div className="flex items-center mt-1">
//                                 <Rate disabled defaultValue={selectedEntreprise?.rating} size="small" />
//                                 <span className="ml-2 text-gray-500 text-sm">
//                                     {selectedEntreprise?.rating} / 5
//                                 </span>
//                             </div>
//                         </div>
//                     </div>
//                     <Button
//                         type="primary"
//                         size="large"
//                         className="flex items-center"
//                         onClick={() => {
//                             setContactModalVisible(true);
//                             setDetailsVisible(false);
//                         }}
//                     >
//                         <PhoneOutlined className="mr-2" />
//                         Contacter
//                     </Button>
//                 </div>
//             }
//             width={800}
//             open={detailsVisible}
//             onClose={() => setDetailsVisible(false)}
//             headerStyle={{ padding: '24px', borderBottom: 'none' }}
//             bodyStyle={{ padding: '0 24px 24px 24px' }}
//             className="rounded-lg"
//         >
//             {selectedEntreprise && (
//                 <div className="space-y-8">
//                     <section className="bg-blue-50 p-6 rounded-xl">
//                         <h2 className="text-xl font-semibold mb-4 text-blue-800">À propos</h2>
//                         <Paragraph className="text-gray-700 text-base leading-relaxed">
//                             {selectedEntreprise.description}
//                         </Paragraph>
//                     </section>

//                     <section>
//                         <h2 className="text-xl font-semibold mb-4">Spécialités</h2>
//                         <Space wrap className="bg-gray-50 p-4 rounded-xl">
//                             {selectedEntreprise.specialites.map(spec => (
//                                 <Tag
//                                     key={spec}
//                                     color="blue"
//                                     className="px-4 py-2 rounded-full text-sm"
//                                 >
//                                     {spec}
//                                 </Tag>
//                             ))}
//                         </Space>
//                     </section>

//                     <section>
//                         <h2 className="text-xl font-semibold mb-4">Services Proposés</h2>
//                         <List
//                             dataSource={selectedEntreprise.services}
//                             className="bg-gray-50 rounded-xl overflow-hidden p-4"
//                             renderItem={item => (
//                                 <List.Item className="px-6 py-3 border-b last:border-b-0 hover:bg-gray-100">
//                                     <div className="flex items-center">
//                                         <div className="w-2 h-2 bg-blue-500 rounded-full mr-3" />
//                                         <Text>{item}</Text>
//                                     </div>
//                                 </List.Item>
//                             )}
//                         />
//                     </section>

//                     <section>
//                         <h2 className="text-xl font-semibold mb-4">Horaires d'Ouverture</h2>
//                         <div className="grid grid-cols-2 gap-4">
//                             {Object.entries(selectedEntreprise.horaires).map(([jour, horaire]) => (
//                                 <div
//                                     key={jour}
//                                     className="bg-gray-50 p-4 rounded-xl flex justify-between items-center hover:bg-gray-100 transition-colors"
//                                 >
//                                     <Text strong className="capitalize">
//                                         {jour}:
//                                     </Text>
//                                     <Text className="text-gray-600">{horaire}</Text>
//                                 </div>
//                             ))}
//                         </div>
//                     </section>

//                     <section>
//                         <h2 className="text-xl font-semibold mb-4">Avis Clients</h2>
//                         <List
//                             dataSource={selectedEntreprise.avis}
//                             className="space-y-4"
//                             renderItem={avis => (
//                                 <List.Item className="bg-gray-50 rounded-xl pt-10">
//                                     <List.Item.Meta
//                                         avatar={

//                                             <div className=" w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center ml-4 mt-2">
//                                                 <span className="text-blue-600 text-lg font-semibold">
//                                                     {avis.client[0]}
//                                                 </span>
//                                             </div>
//                                         }
//                                         title={
//                                             <div className="flex items-center space-x-4">
//                                                 <span className="font-semibold text-lg">
//                                                     {avis.client}
//                                                 </span>
//                                                 <Rate
//                                                     disabled
//                                                     defaultValue={avis.note}
//                                                     size="small"
//                                                 />
//                                             </div>
//                                         }
//                                         description={
//                                             <Paragraph className="mt-2 text-gray-600">
//                                                 {avis.commentaire}
//                                             </Paragraph>
//                                         }
//                                     />
//                                 </List.Item>
//                             )}
//                         />
//                     </section>
//                 </div>
//             )}
//         </Drawer>
//     );
//     const ContactModal = () => (
//         <Modal
//             title={
//                 <div className="flex items-center space-x-3">
//                     <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
//                         <PhoneOutlined className="text-blue-600 text-lg" />
//                     </div>
//                     <span className="text-xl font-semibold">
//                         Contacter {selectedEntreprise?.nom}
//                     </span>
//                 </div>
//             }
//             open={contactModalVisible}
//             onCancel={() => setContactModalVisible(false)}
//             footer={null}
//             className="rounded-lg"
//             width={600}
//         >
//             {selectedEntreprise && (
//                 <div className="space-y-4 mt-6">
//                     <div className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
//                         <div className="flex items-center justify-between">
//                             <div className="flex items-center space-x-3">
//                                 <PhoneOutlined className="text-blue-500 text-lg" />
//                                 <Text strong>Téléphone</Text>
//                             </div>
//                             <Text copyable={{ text: selectedEntreprise.telephone }}>
//                                 {selectedEntreprise.telephone}
//                             </Text>
//                         </div>
//                     </div>

//                     <div className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
//                         <div className="flex items-center justify-between">
//                             <div className="flex items-center space-x-3">
//                                 <MailOutlined className="text-blue-500 text-lg" />
//                                 <Text strong>Email</Text>
//                             </div>
//                             <Text copyable={{ text: selectedEntreprise.email }}>
//                                 {selectedEntreprise.email}
//                             </Text>
//                         </div>
//                     </div>

//                     <div className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
//                         <div className="flex items-center justify-between">
//                             <div className="flex items-center space-x-3">
//                                 <GlobalOutlined className="text-blue-500 text-lg" />
//                                 <Text strong>Site web</Text>
//                             </div>
//                             <Text copyable={{ text: selectedEntreprise.site }}>
//                                 {selectedEntreprise.site}
//                             </Text>
//                         </div>
//                     </div>

//                     <div className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
//                         <div className="flex items-center justify-between">
//                             <div className="flex items-center space-x-3">
//                                 <EnvironmentOutlined className="text-blue-500 text-lg" />
//                                 <Text strong>Adresse</Text>
//                             </div>
//                             <Text copyable={{ text: selectedEntreprise.adresse }}>
//                                 {selectedEntreprise.adresse}
//                             </Text>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </Modal>
//     );
//     const Empty = () => (
//         <div className="flex flex-col items-center justify-center p-8">
//             <Empty
//                 image={Empty.PRESENTED_IMAGE_SIMPLE}
//                 description={
//                     <Text className="text-gray-500">
//                         Aucune entreprise trouvée
//                     </Text>
//                 }
//             />
//         </div>
//     );
    
//     const SearchBar = () => (
//         <div className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ease-in-out ${isSearchVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'}`}>
//             <div className="max-w-3xl mx-auto p-4">
//                 <div className="bg-gray-50/95 backdrop-blur-sm rounded-xl p-4 shadow-lg relative">
//                     <Button
//                         type="text"
//                         icon={<CloseOutlined />}
//                         className="absolute right-2 top-2"
//                         onClick={() => setIsSearchVisible(false)}
//                     />
//                     <Title level={5} className="mb-3 text-gray-700">
//                         Rechercher une entreprise
//                     </Title>
//                     <Row gutter={[12, 12]} className="items-center">
//                         <Col xs={24} md={14}>
//                             <Input
//                                 size="middle"
//                                 placeholder="Rechercher par nom, spécialité..."
//                                 value={searchText}
//                                 prefix={<SearchOutlined className="text-gray-400" />}
//                                 onChange={(e) => handleSearch(e.target.value)}
//                                 className="rounded-lg hover:border-blue-400 focus:border-blue-500"
//                                 allowClear
//                                 autoFocus
//                             />
//                         </Col>
//                         <Col xs={24} md={10}>
//                             <Select
//                                 size="middle"
//                                 className="w-full rounded-lg"
//                                 placeholder={
//                                     <span>
//                                         <FilterOutlined className="mr-2" />
//                                         Filtrer par spécialité
//                                     </span>
//                                 }
//                                 onChange={handleSpecialiteChange}
//                                 allowClear
//                                 suffixIcon={<FilterOutlined className="text-gray-400" />}
//                             >
//                                 {specialites.map(specialite => (
//                                     <Option key={specialite} value={specialite}>{specialite}</Option>
//                                 ))}
//                             </Select>
//                         </Col>
//                     </Row>
//                 </div>
//             </div>
//             {/* Semi-transparent overlay */}
//             <div 
//                 className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
//                 onClick={() => setIsSearchVisible(false)}
//             />
//         </div>
//     );
//     const EmptyState = () => (
//         <div className="flex flex-col items-center justify-center p-8">
//             <Empty
//                 image={Empty.PRESENTED_IMAGE_SIMPLE}
//                 description={
//                     <Text className="text-gray-500">
//                         Aucune entreprise trouvée
//                     </Text>
//                 }
//             />
//         </div>
//     );
//     const SearchToggle = () => (
//         <Button
//             type="primary"
//             icon={<SearchOutlined />}
//             size="large"
//             className="fixed bottom-6 right-6  rounded-full w-12 h-12 flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200 z-40"
//             onClick={() => setIsSearchVisible(true)}
//         />
//     );

//     return (
//         <div className="max-w-7xl mx-auto p-2">
//             <SearchToggle />
//             <SearchBar />           

//             {/* Results Count */}
//             <div className="mb-4">
//                 <Text className="text-gray-600">
//                     {filteredEntreprises.length} entreprise{filteredEntreprises.length !== 1 ? 's' : ''} trouvée{filteredEntreprises.length !== 1 ? 's' : ''}
//                 </Text>
//             </div>

//             {/* Enterprise Cards Grid */}
//             <List
//                 grid={{
//                     gutter: [16, 16],
//                     xs: 1,
//                     sm: 2,
//                     md: 3,
//                     lg: 4,
//                     xl: 4,
//                     xxl: 4,
//                 }}
//                 dataSource={filteredEntreprises}
//                 EmptyState ={{
//                     emptyText: <Empty description="Aucune entreprise trouvée" />
//                 }}
//                 renderItem={entreprise => (
//                     <List.Item>
//                         <Card
//                             hoverable
//                             className="overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
//                             bodyStyle={{ padding: '1rem' }}
//                             cover={
//                                 <div className="relative bg-gradient-to-b from-gray-50 to-white p-4">
//                                     <div className="absolute top-2 right-2">
//                                         {/* <Tag color="blue" className="rounded-full px-2 py-0 text-xs">
//                                             {entreprise.specialites[0]}
//                                         </Tag> */}
//                                     </div>
//                                     <div className="flex items-center justify-center h-28">
//                                         <div className="w-32 h-24 relative flex items-center justify-center">
//                                             <img
//                                                 alt={entreprise.nom}
//                                                 src={entreprise.images[0]}
//                                                 className="max-w-full max-h-full object-contain"
//                                             />
//                                         </div>
//                                     </div>
//                                 </div>
//                             }
//                         >
//                             <div className="space-y-2">
//                                 {/* Company Name and Rating */}
//                                 <div className="flex justify-between items-start gap-2">
//                                     <Text strong className="text-base text-gray-800 leading-tight flex-1">
//                                         {entreprise.nom}
//                                     </Text>
//                                     <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-md">
//                                         <StarFilled className="text-yellow-400 mr-1 text-xs" />
//                                         <Text strong className="text-xs text-gray-700">
//                                             {entreprise.rating}
//                                         </Text>
//                                     </div>
//                                 </div>

//                                 {/* Description */}
//                                 <Paragraph
//                                     ellipsis={{ rows: 2 }}
//                                     className="text-xs text-gray-500 mb-1 leading-relaxed"
//                                 >
//                                     {entreprise.description}
//                                 </Paragraph>

//                                 {/* Location and Schedule */}
//                                 <div className="space-y-1">
//                                     <div className="flex items-center text-gray-500">
//                                         <EnvironmentOutlined className="mr-1 text-xs" />
//                                         <Text ellipsis className="text-xs">
//                                             {entreprise.adresse}
//                                         </Text>
//                                     </div>
//                                     <div className="flex items-center text-gray-500">
//                                         <ClockCircleOutlined className="mr-1 text-xs" />
//                                         <Text className="text-xs">
//                                             {entreprise.horaires.lundi}
//                                         </Text>
//                                     </div>
//                                 </div>

//                                 {/* Action Button */}
//                                 <div className='h-3'></div>
//                                 <Button
//                                     type="primary"
//                                     icon={<EyeOutlined />}
//                                     onClick={() => showDetails(entreprise)}
//                                     className="w-full rounded-lg h-8 text-xs mt-10"
//                                 >
//                                     Voir Plus
//                                 </Button>
//                             </div>
//                         </Card>
//                     </List.Item>
//                 )}
//             />

//             <DetailsDrawer />
//             <ContactModal />
//         </div>
//     );
// };

// export default EntrepriseServices;

import React, { useState, useEffect } from "react";
import {
  Card,
  List,
  Tag,
  Input,
  Select,
  Row,
  Col,
  Button,
  Rate,
  Modal,
  Drawer,
  Typography,
  Space,
  Divider,
  Badge,
} from "antd";
import {
  SearchOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
  GlobalOutlined,
  EyeOutlined,
  StarFilled,
  ClockCircleOutlined,
  FilterOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { Endponit, token } from "../../helper/enpoint";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Meta } = Card;

const EntrepriseServices = () => {
  const [searchText, setSearchText] = useState("");
  const [selectedSpecialite, setSelectedSpecialite] = useState("");
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedEntreprise, setSelectedEntreprise] = useState(null);
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [entreprises, setEntreprises] = useState([]);
  const [specialites, setSpecialites] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(Endponit()+"/api/ESN/", {
        headers: {
          Authorization: `Bearer ${token()}`,
        },
      });
      const data = await response.json();
      setEntreprises(data.data);

      // Extract unique specialities
    //   const allSpecialities = data.data.flatMap((e) =>
    //     e.Specialites.split(",").map((s) => s.trim())
    //   );
      setSpecialites([...new Set("")]);
    };
    fetchData();
  }, []);

  const handleSearch = (value) => {
    setSearchText(value.toLowerCase().trim());
  };

  const handleSpecialiteChange = (value) => {
    setSelectedSpecialite(value);
  };

  const showDetails = (entreprise) => {
    setSelectedEntreprise(entreprise);
    setDetailsVisible(true);
  };

  const filteredEntreprises = entreprises.filter((entreprise) => {
    const matchSearch =
      searchText === "" ||
      entreprise.Raison_sociale?.toLowerCase().includes(searchText) ||
      entreprise?.Specialites?.toLowerCase().includes(searchText);

    const matchSpecialite =
      !selectedSpecialite ||
      entreprise?.Specialites?.split(",")
        .map((s) => s.trim())
        .includes(selectedSpecialite);

    return matchSearch && matchSpecialite;
  });

  const DetailsDrawer = () => (
    <Drawer
      title={
        <div className="flex items-center justify-between w-full border-b pb-4 mt-2">
          <div className="flex items-center space-x-4">
            <img
              src="/api/placeholder/80/80"
              alt={selectedEntreprise?.Raison_sociale}
              className="w-12 h-12 object-contain rounded"
            />
            <div>
              <h1 className="text-xl font-semibold text-gray-800">
                {selectedEntreprise?.Raison_sociale}
              </h1>
              <div className="flex items-center mt-1">
                <Rate disabled defaultValue={4} size="small" />
                <span className="ml-2 text-gray-500 text-sm">4 / 5</span>
              </div>
            </div>
          </div>
          <Button
            type="primary"
            size="large"
            className="flex items-center"
            onClick={() => {
              setContactModalVisible(true);
              setDetailsVisible(false);
            }}
          >
            <PhoneOutlined className="mr-2" />
            Contact
          </Button>
        </div>
      }
      width={800}
      open={detailsVisible}
      onClose={() => setDetailsVisible(false)}
      headerStyle={{ padding: "24px", borderBottom: "none" }}
      bodyStyle={{ padding: "0 24px 24px 24px" }}
      className="rounded-lg"
    >
      {selectedEntreprise && (
        <div className="space-y-8">
          <section className="bg-blue-50 p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-4 text-blue-800">About</h2>
            <Paragraph className="text-gray-700 text-base leading-relaxed">
              {selectedEntreprise.Description}
            </Paragraph>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Specialities</h2>
            <Space wrap className="bg-gray-50 p-4 rounded-xl">
              {/* {selectedEntreprise.Specialites.split(",").map((spec) => (
                <Tag
                  key={spec}
                  color="blue"
                  className="px-4 py-2 rounded-full text-sm"
                >
                  {spec.trim()}
                </Tag>
              ))} */}
            </Space>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Services</h2>
            <List
            //   dataSource={selectedEntreprise.Services.split(",")}
              className="bg-gray-50 rounded-xl overflow-hidden p-4"
              renderItem={(item) => (
                <List.Item className="px-6 py-3 border-b last:border-b-0 hover:bg-gray-100">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3" />
                    <Text>{item.trim()}</Text>
                  </div>
                </List.Item>
              )}
            />
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Opening Hours</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl flex justify-between items-center hover:bg-gray-100 transition-colors">
                <Text strong className="capitalize">
                  Monday:
                </Text>
                <Text className="text-gray-600">9:00 - 18:00</Text>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl flex justify-between items-center hover:bg-gray-100 transition-colors">
                <Text strong className="capitalize">
                  Tuesday:
                </Text>
                <Text className="text-gray-600">9:00 - 18:00</Text>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl flex justify-between items-center hover:bg-gray-100 transition-colors">
                <Text strong className="capitalize">
                  Wednesday:
                </Text>
                <Text className="text-gray-600">9:00 - 18:00</Text>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl flex justify-between items-center hover:bg-gray-100 transition-colors">
                <Text strong className="capitalize">
                  Thursday:
                </Text>
                <Text className="text-gray-600">9:00 - 18:00</Text>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl flex justify-between items-center hover:bg-gray-100 transition-colors">
                <Text strong className="capitalize">
                  Friday:
                </Text>
                <Text className="text-gray-600">9:00 - 17:00</Text>
              </div>
            </div>
          </section>
        </div>
      )}
    </Drawer>
  );

  const ContactModal = () => (
    <Modal
      title={
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <PhoneOutlined className="text-blue-600 text-lg" />
          </div>
          <span className="text-xl font-semibold">
            Contact {selectedEntreprise?.Raison_sociale}
          </span>
        </div>
      }
      open={contactModalVisible}
      onCancel={() => setContactModalVisible(false)}
      footer={null}
      className="rounded-lg"
      width={600}
    >
      {selectedEntreprise && (
        <div className="space-y-4 mt-6">
          <div className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <PhoneOutlined className="text-blue-500 text-lg" />
                <Text strong>Phone</Text>
              </div>
              <Text copyable={{ text: selectedEntreprise.Tel_Contact }}>
                {selectedEntreprise.Tel_Contact}
              </Text>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MailOutlined className="text-blue-500 text-lg" />
                <Text strong>Email</Text>
              </div>
              <Text copyable={{ text: selectedEntreprise.mail_Contact }}>
                {selectedEntreprise.mail_Contact}
              </Text>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <GlobalOutlined className="text-blue-500 text-lg" />
                <Text strong>Website</Text>
              </div>
              <Text
                copyable={{
                  text: `http://${selectedEntreprise.Raison_sociale.toLowerCase().replace(
                    /\s/g,
                    "-"
                  )}.com`,
                }}
              >
                {`http://${selectedEntreprise.Raison_sociale.toLowerCase().replace(
                  /\s/g,
                  "-"
                )}.com`}
              </Text>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <EnvironmentOutlined className="text-blue-500 text-lg" />
                <Text strong>Address</Text>
              </div>
              <Text copyable={{ text: selectedEntreprise.Adresse }}>
                {selectedEntreprise.Adresse}
              </Text>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );

  const Empty = () => (
    <div className="flex flex-col items-center justify-center p-8">
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <Text className="text-gray-500">No enterprises found</Text>
        }
      />
    </div>
  );

  const SearchBar = () => (
    <div
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ease-in-out ${
        isSearchVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-full"
      }`}
    >
      <div className="max-w-3xl mx-auto p-4">
        <div className="bg-gray-50/95 backdrop-blur-sm rounded-xl p-4 shadow-lg relative">
          <Button
            type="text"
            icon={<CloseOutlined />}
            className="absolute right-2 top-2"
            onClick={() => setIsSearchVisible(false)}
          />
          <Title level={5} className="mb-3 text-gray-700">
            Search Enterprises
          </Title>
          <Row gutter={[12, 12]} className="items-center">
            <Col xs={24} md={14}>
              <Input
                size="middle"
                placeholder="Search by name, speciality..."
                value={searchText}
                prefix={<SearchOutlined className="text-gray-400" />}
                onChange={(e) => handleSearch(e.target.value)}
                className="rounded-lg hover:border-blue-400 focus:border-blue-500"
                allowClear
                autoFocus
              />
            </Col>
            <Col xs={24} md={10}>
              <Select
                size="middle"
                className="w-full rounded-lg"
                placeholder={
                  <span>
                    <FilterOutlined className="mr-2" />
                    Filter by Speciality
                  </span>
                }
                onChange={handleSpecialiteChange}
                allowClear
                suffixIcon={<FilterOutlined className="text-gray-400" />}
              >
                {/* {specialites.map((specialite) => (
                  <Option key={specialite} value={specialite}>
                    {specialite}
                  </Option>
                ))} */}
              </Select>
            </Col>
          </Row>
        </div>
      </div>
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
        onClick={() => setIsSearchVisible(false)}
      />
    </div>
  );

  const EnterpriseCard = ({ entreprise }) => (
    <List.Item>
        <Card
            hoverable
            className="overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
            bodyStyle={{ padding: '1rem' }}
            cover={
                <div className="relative bg-gradient-to-b from-gray-50 to-white p-4">
                    <div className="absolute top-2 right-2">
                        {/* {entreprise.Specialites.split(',').map((spec, index) => (
                            <Tag
                                key={index}
                                color="blue"
                                className="rounded-full px-2 py-0 text-xs"
                            >
                                {spec.trim()}
                            </Tag>
                        ))} */}
                    </div>
                    <div className="flex items-center justify-center h-28">
                        <div className="w-32 h-24 relative flex items-center justify-center">
                            <img
                                alt={entreprise.Raison_sociale}
                                src="/api/placeholder/80/80"
                                className="max-w-full max-h-full object-contain"
                            />
                        </div>
                    </div>
                </div>
            }
        >
            <div className="space-y-2">
                <div className="flex justify-between items-start gap-2">
                    <Text strong className="text-base text-gray-800 leading-tight flex-1">
                        {entreprise.Raison_sociale}
                    </Text>
                    <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-md">
                        <StarFilled className="text-yellow-400 mr-1 text-xs" />
                        <Text strong className="text-xs text-gray-700">
                            4.5
                        </Text>
                    </div>
                </div>
                <Paragraph
                    ellipsis={{ rows: 2 }}
                    className="text-xs text-gray-500 mb-1 leading-relaxed"
                >
                    {entreprise.Description}
                </Paragraph>
                <div className="space-y-1">
                    <div className="flex items-center text-gray-500">
                        <EnvironmentOutlined className="mr-1 text-xs" />
                        <Text ellipsis className="text-xs">
                            {entreprise.Adresse}
                        </Text>
                    </div>
                    <div className="flex items-center text-gray-500">
                        <ClockCircleOutlined className="mr-1 text-xs" />
                        <Text className="text-xs">
                            9:00 - 18:00
                        </Text>
                    </div>
                </div>
                <div className='h-3'></div>
                <Button
                    type="primary"
                    icon={<EyeOutlined />}
                    onClick={() => showDetails(entreprise)}
                    className="w-full rounded-lg h-8 text-xs mt-10"
                >
                    View Details
                </Button>
            </div>
        </Card>
    </List.Item>
);

  const SearchToggle = () => (
    <Button
      type="primary"
      icon={<SearchOutlined />}
      size="large"
      className="fixed bottom-6 right-6  rounded-full w-12 h-12 flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200 z-40"
      onClick={() => setIsSearchVisible(true)}
    />
  );
  return (
    <div className="max-w-7xl mx-auto p-2">
      <SearchToggle />
      <SearchBar />

      <div className="mb-4">
        <Text className="text-gray-600">
          {filteredEntreprises.length} enterprise
          {filteredEntreprises.length !== 1 ? "s" : ""} found
        </Text>
      </div>

      <List
        grid={{
          gutter: [16, 16],
          xs: 1,
          sm: 2,
          md: 3,
          lg: 4,
          xl: 4,
          xxl: 4,
        }}
        dataSource={filteredEntreprises}
        EmptyState={{
          emptyText: <Empty description="No enterprises found" />,
        }}
        renderItem={(entreprise) => <EnterpriseCard entreprise={entreprise} />}
      />

      <DetailsDrawer />
      <ContactModal />
    </div>
  );
};

export default EntrepriseServices;
