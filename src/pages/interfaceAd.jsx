import React, { useState, useEffect } from "react";
import {
  AppstoreOutlined,
  RiseOutlined,
  SettingOutlined,
  UserOutlined,
  FileOutlined,
  CalendarOutlined,
  UsergroupAddOutlined,
  LogoutOutlined,
  MenuOutlined
} from "@ant-design/icons";
import { Avatar, Divider, Menu, Tag, Dropdown, Button, Badge } from "antd";
import { useNavigate } from "react-router-dom";
import { ClientList } from "../components/ad-interface/list-cl";
import ContractStats from "../components/ad-interface/list-contract";
import ClientDocument from "../components/cl-interface/document";
import CollaboratorList from "../components/ad-interface/list-ens";
import { isAdminLoggedIn } from "../helper/db";
import BDCManagement from "../components/ad-interface/bdc-validateur";
import ListeAppelOffre from "../components/ad-interface/list-appeloffre";
import ConsulterBDC from "../components/ad-interface/consulter-bdc";
import axios from "axios";
import { Endponit } from "../helper/enpoint";

// Component mapping for dynamic rendering
const COMPONENT_MAP = {
  dashboard: () => <ContractStats />,
  profile: () => <CollaboratorList />,
  collaborateur: () => <ClientList />,
  documents: () => <ClientDocument />,
  appeloffre: () => <ListeAppelOffre />,
  bdc: () => <BDCManagement />,
  bdcconsult: () => <ConsulterBDC />,
};

const InterfaceAd = () => {
  const [current, setCurrent] = useState("dashboard");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [pendingBDCCount, setPendingBDCCount] = useState(0);
  const [pendingESNCount, setPendingESNCount] = useState(0);
  const [pendingClientCount, setPendingClientCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const auth = isAdminLoggedIn();
    if (auth === false) {
      navigate("/LoginAdmin");
    }
    
    // Add responsive handler
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Fetch all pending counts
    fetchPendingBDCCount();
    fetchPendingESNCount();
    fetchPendingClientCount();
    
    // Set up interval to refresh counts periodically
    const bdcIntervalId = setInterval(fetchPendingBDCCount, 60000);
    const esnIntervalId = setInterval(fetchPendingESNCount, 60000);
    const clientIntervalId = setInterval(fetchPendingClientCount, 60000);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(bdcIntervalId);
      clearInterval(esnIntervalId);
      clearInterval(clientIntervalId);
    };
  }, [navigate]);

  const fetchPendingBDCCount = async () => {
    try {
      const response = await axios.get(`${Endponit()}/api/Bondecommande`);
      const bdcsData = response.data.data || [];
      const pendingAdminCount = bdcsData.filter(bdc => bdc.statut === "pending_admin").length;
      setPendingBDCCount(pendingAdminCount);
    } catch (error) {
      console.error("Error fetching BDC count:", error);
    }
  };

  const fetchPendingESNCount = async () => {
    try {
      const response = await axios.get(`${Endponit()}/api/ESN`);
      const esnsData = response.data.data || [];
      const pendingValidationCount = esnsData.filter(esn => esn.Statut === "à valider").length;
      setPendingESNCount(pendingValidationCount);
    } catch (error) {
      console.error("Error fetching ESN count:", error);
    }
  };

  const fetchPendingClientCount = async () => {
    try {
      const response = await axios.get(`${Endponit()}/api/client`);
      const clientsData = response.data.data || [];
      const pendingValidationCount = clientsData.filter(client => client.statut === "à valider").length;
      setPendingClientCount(pendingValidationCount);
    } catch (error) {
      console.error("Error fetching Client count:", error);
    }
  };

  const getMenuItems = () => [
    {
      label: "Tableau de Bord",
      key: "dashboard",
      icon: <AppstoreOutlined />,
    },
    {
      label: (
        <span>
          Liste 'ESN
          {pendingESNCount > 0 && (
            <Badge 
              count={pendingESNCount} 
              size="small" 
              style={{ marginLeft: 8 }}
            />
          )}
        </span>
      ),
      key: "profile",
      icon: <UserOutlined />,
    },
    {
      label: (
        <span>
          Liste Clients
          {pendingClientCount > 0 && (
            <Badge 
              count={pendingClientCount} 
              size="small" 
              style={{ marginLeft: 8 }}
            />
          )}
        </span>
      ),
      key: "collaborateur",
      icon: <UsergroupAddOutlined />,
    },
    {
      label: "Appels d'offres",
      key: "appeloffre",
      icon: <RiseOutlined />,
    },
    {
      label: (
        <span>
          Bon de commande
          {pendingBDCCount > 0 && (
            <Badge 
              count={pendingBDCCount} 
              size="small" 
              style={{ marginLeft: 8 }}
            />
          )}
        </span>
      ),
      key: "bdc",
      icon: <FileOutlined />,
    },
    // {
    //   label: "Consulter les Bon de commandes",
    //   key: "bdcconsult",
    //   icon: <CalendarOutlined />,
    // },
  ];

  const onClick = (e) => {
    setCurrent(e.key);
    
    // Refresh respective counts when navigating to their sections
    if (e.key === "bdc") {
      fetchPendingBDCCount();
    } else if (e.key === "profile") {
      fetchPendingESNCount();
    } else if (e.key === "collaborateur") {
      fetchPendingClientCount();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/loginAdmin");
  };

  const renderComponent = () => {
    const [section, subsection] = current.split(":");
    const Component = COMPONENT_MAP[section];
    return Component ? <Component subsection={subsection} /> : null;
  };

  // Mobile menu as dropdown
  const mobileMenu = (
    <Menu
      onClick={onClick}
      selectedKeys={[current]}
      items={getMenuItems()}
    />
  );

  return (
    <div className="w-full flex flex-col min-h-screen">
      <div className="w-full flex justify-between px-4 py-3 items-center shadow-md bg-white sticky top-0 z-10">
        <div className="flex items-center">
          <Avatar
            size={40}
            src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png"
          />
          {isMobile && <span className="ml-3 font-medium">MaghrebitConnect</span>}
        </div>
        
        {isMobile ? (
          <div className="flex items-center">
            <Tag color="blue" className="mr-3">Admin</Tag>
            <Dropdown 
              overlay={mobileMenu} 
              trigger={['click']}
              placement="bottomRight"
            >
              <Button type="text" icon={<MenuOutlined />} />
            </Dropdown>
            <LogoutOutlined
              onClick={handleLogout}
              className="ml-3"
              style={{
                fontSize: "18px",
                cursor: "pointer",
                color: "#ff4d4f",
              }}
              title="Déconnexion"
            />
          </div>
        ) : (
          <>
            <Menu
              className="flex-1 mx-4"
              onClick={onClick}
              selectedKeys={[current]}
              mode="horizontal"
              items={getMenuItems()}
              style={{
                border: "none",
              }}
            />
            <div className="flex space-x-3 items-center">
              <Tag color="blue">Admin</Tag>
              <LogoutOutlined
                onClick={handleLogout}
                style={{
                  fontSize: "16px",
                  cursor: "pointer",
                  color: "#ff4d4f",
                }}
                title="Déconnexion"
              />
            </div>
          </>
        )}
      </div>
      <div className="pl-5 pr-5">
        <hr />
      </div>
      <div className="px-5 py-4 flex-grow">
        {renderComponent()}
      </div>
    </div>
  );
};

export default InterfaceAd;