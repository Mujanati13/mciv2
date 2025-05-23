import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Space,
  Divider,
  message,
} from "antd";
import { UserOutlined, LockOutlined, IdcardOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { Endponit } from "../helper/enpoint";

const { Title, Text, Link } = Typography;

const UnifiedLoginPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const authToken = localStorage.getItem("unifiedToken");
    const userId = localStorage.getItem("userId");
    const userRole = localStorage.getItem("userRole");
    
    if (authToken && userId) {
      // Redirect based on role
      if (userRole === "consultant") {
        navigate("/interface-consultant");
      } else if (userRole === "commercial") {
        navigate("/interface-commercial");
      }
    }
  }, [navigate]);

  const handleLogin = async (values) => {
    setLoading(true);

    try {
      const endpoint = Endponit() + "/api/unified_login/";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: values.username,
          password: values.password,
        }),
      });

      const data = await response.json();      if (response.ok && data.success === true) {
        message.success("Connexion réussie!");

        // Store user data
        localStorage.setItem("unifiedToken", data.token);
        localStorage.setItem("userId", data.data.ID_collab);
        localStorage.setItem("userRole", data.role);
        localStorage.setItem("esnId", data.esn_id);
        localStorage.setItem("userName", `${data.data.Prenom} ${data.data.Nom}`);
        localStorage.setItem("userType", "internal"); // Differentiate from client/ESN users
        
        // Clear any leftover data from previous sessions
        localStorage.removeItem("consultantProjects");
        localStorage.removeItem("projectsData");
        
        // Redirect based on role
        if (data.role === "consultant") {
          navigate("/interface-consultant");
        } else if (data.role === "commercial") {
          navigate("/interface-commercial");
        } else {
          message.error("Rôle d'utilisateur non reconnu");
          localStorage.clear(); // Clear all localStorage if role is invalid
        }
      } else {
        message.error(data.message || "Identifiants invalides");
      }
    } catch (error) {
      console.error("Login error:", error);
      message.error("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  const goToClientLogin = () => {
    navigate("/loginClient");
  };

  const goToESNLogin = () => {
    navigate("/loginESN");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <Card
        style={{
          maxWidth: "400px",
          width: "100%",
          boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "40px", color: "#1890ff", textAlign: "center", marginBottom: "10px" }}>
            <IdcardOutlined />
          </div>
          <Title level={2} style={{ margin: 0 }}>
            Espace Collaborateur
          </Title>
          <Text type="secondary">
            Connectez-vous pour accéder à votre interface
          </Text>
        </div>

        <Form
          name="unified_login"
          initialValues={{ remember: true }}
          onFinish={handleLogin}
          layout="vertical"
        >
          <Form.Item
            name="username"
            rules={[
              {
                required: true,
                message: "Veuillez saisir votre adresse e-mail",
              },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Adresse e-mail"
              size="large"
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[
              {
                required: true,
                message: "Veuillez saisir votre mot de passe",
              },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Mot de passe"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
            >
              Se connecter
            </Button>
          </Form.Item>
        </Form>

        <Divider style={{ marginTop: 0 }}>Autres espaces</Divider>

        <Space direction="vertical" style={{ width: "100%" }}>
          <Button
            block
            onClick={goToClientLogin}
            style={{ marginBottom: "8px" }}
          >
            Espace Client
          </Button>
          <Button block onClick={goToESNLogin}>
            Espace ESN
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default UnifiedLoginPage;
