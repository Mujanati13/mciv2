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
} from "@ant-design/icons";
import { Avatar, Divider, Menu, Tag } from "antd";
import { useNavigate } from "react-router-dom";
import { ClientList } from "../components/ad-interface/list-cl";
import ContractStats from "../components/ad-interface/list-contract";
import ClientDocument from "../components/cl-interface/document";
import CollaboratorList from "../components/ad-interface/list-ens";
import { isAdminLoggedIn } from "../helper/db";
import BDCManagement from "../components/ad-interface/bdc-validateur";

const items = [
  {
    label: "Tableau de Bord",
    key: "dashboard",
    icon: <AppstoreOutlined />,
  },
  {
    label: "Liste 'ESN",
    key: "profile",
    icon: <UserOutlined />,
  },
  {
    label: "Liste Clients",
    key: "collaborateur",
    icon: <UsergroupAddOutlined />,
  },
  {
    label: "Liste Contrats",
    key: "Contrats",
    // icon: <UsergroupAddOutlined />,
  },
  {
    label: "Bon de commande",
    key: "bdc",
    // icon: <UsergroupAddOutlined />,
  },
  // Previous commented-out menu items remain the same
];

const InterfaceAd = () => {
  const [current, setCurrent] = useState("dashboard");
  const navigate = useNavigate();

  useEffect(() => {
    const auth = isAdminLoggedIn();
    if (auth === false) {
      navigate("/LoginAdmin");
    }
  }, [navigate]);

  const onClick = (e) => {
    console.log("click ", e);
    setCurrent(e.key);
  };

  const handleLogout = () => {
    // Remove admin token from localStorage
    localStorage.removeItem("adminToken");

    // Redirect to login page
    navigate("/loginAdmin");
  };

  const renderComponent = () => {
    const [section, subsection] = current.split(":");

    switch (section) {
      case "dashboard":
        return <></>;
      case "profile":
        return <CollaboratorList />;
      case "collaborateur":
        return <ClientList />;
      case "documents":
        return <ClientDocument />;
      case "Contrats":
        return <ContractStats />;
      case "bdc":
        return <BDCManagement />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      <div className="w-full flex justify-between p-5 items-center">
        <Avatar
          size={40}
          src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png"
        />
        <Menu
          className="w-[80%]"
          onClick={onClick}
          selectedKeys={[current]}
          mode="horizontal"
          items={items}
          style={{
            display: "flex",
            justifyContent: "",
            border: "none",
          }}
          expandedKeys={["calendar", "settings"]}
        />
        <div className="flex space-x-3 items-center">
          <Tag>Admin</Tag>
          <LogoutOutlined
            onClick={handleLogout}
            style={{
              fontSize: "16px",
              cursor: "pointer",
              color: "#ff4d4f", // Optional: add a reddish color to signify logout
            }}
            title="Déconnexion"
          />
        </div>
      </div>
      <div className="pl-5 pr-5">
        <hr />
      </div>
      <div className="px-5">{renderComponent()}</div>
    </div>
  );
};

export default InterfaceAd;
