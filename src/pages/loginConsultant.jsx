import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Checkbox,
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

const LoginConsultantPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if consultant is already logged in
    const authToken = localStorage.getItem("consultantToken");
    const consultantId = localStorage.getItem("consultantId");
    
    // Check for unified login credentials
    const unifiedToken = localStorage.getItem("unifiedToken");
    const userId = localStorage.getItem("userId");
    const userRole = localStorage.getItem("userRole");
    
    if (authToken && consultantId) {
      navigate("/interface-consultant");
    } else if (unifiedToken && userId && userRole === "consultant") {
      navigate("/interface-consultant");
    } else if (unifiedToken && userId && userRole === "commercial") {
      navigate("/interface-commercial");
    }
    
    // Show message about the new login system
    message.info("Nous avons migré vers un système de connexion unifié. Vous serez redirigé dans quelques secondes...");
    
    // Redirect to unified login after a short delay
    const redirectTimer = setTimeout(() => {
      navigate("/unified-login");
    }, 3000);
    
    return () => clearTimeout(redirectTimer);
  }, [navigate]);

  const handleLogin = async (values) => {
    setLoading(true);

    try {
      const endpoint = Endponit() + "/api/login_consultant/";

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

      const data = await response.json();

      if (response.ok && data.success === true) {
        message.success("Connexion réussie!");

        // Store consultant data
        localStorage.setItem("consultantToken", data.token);
        localStorage.setItem("consultantId", data.data.ID_collab);
        localStorage.setItem("userType", "consultant");
        
        navigate("/interface-consultant");
      } else {
        message.error(data.message || "Identifiants invalides");
      }
    } catch (error) {
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
          <Title level={2} style={{ marginBottom: "8px" }}>
            Espace Consultant
          </Title>
          <Text type="secondary">Connectez-vous à votre espace consultant</Text>
        </div>

        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={handleLogin}
          size="large"
          layout="vertical"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: "Veuillez saisir votre Email!" },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Adresse email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              {
                required: true,
                message: "Veuillez saisir votre mot de passe!",
              },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Mot de passe"
            />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: "100%" }} justify="space-between">
              <Checkbox name="remember">Se souvenir de moi</Checkbox>
              <Link>Mot de passe oublié ?</Link>
            </Space>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                height: "40px",
                borderRadius: "6px",
                background: "#1890ff",
              }}
            >
              Se connecter
            </Button>
          </Form.Item>

          <Divider plain>
            <Text type="secondary">OU</Text>
          </Divider>

          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            <div style={{ textAlign: "center" }}>
              <Text type="secondary">
                Vous êtes un client ?{" "}
                <Link onClick={goToClientLogin}>Connexion Client</Link>
              </Text>
            </div>
            <div style={{ textAlign: "center" }}>
              <Text type="secondary">
                Vous êtes un prestataire ?{" "}
                <Link onClick={goToESNLogin}>Connexion Prestataire</Link>
              </Text>
            </div>
          </Space>
        </Form>
      </Card>
    </div>
  );
};

export default LoginConsultantPage;