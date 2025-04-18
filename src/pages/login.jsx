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
import { UserOutlined, LockOutlined, BankOutlined } from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { isClientLoggedIn, isEsnLoggedIn } from "../helper/db";
import { Endponit } from "../helper/enpoint";

const { Title, Text, Link } = Typography;

const LoginPage = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const typeFromURL = queryParams.get("type");
  
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState(typeFromURL || "client");
  const [showLoginForm, setShowLoginForm] = useState(!!typeFromURL);
  const navigate = useNavigate();

  useEffect(() => {
    const auth = isEsnLoggedIn();
    const auth2 = isClientLoggedIn();
    if (auth == true) {
      navigate("/interface-en");
    } else if (auth2 == true) {
      navigate("/interface-cl");
    }
  }, []);

  const selectUserType = (type) => {
    setUserType(type);
    setShowLoginForm(true);
    // Update URL without reloading page
    window.history.replaceState({}, '', `${window.location.pathname}?type=${type}`);
  };

  const handleLogin = async (values) => {
    setLoading(true);

    try {
      const endpoint =
        userType === "client"
          ? Endponit() + "/api/login_client/"
          : Endponit() + "/api/login_esn/";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: values.username,
          password: values.password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success === true) {
        message.success("Connexion réussie!");

        // Store user data based on user type
        localStorage.setItem("token", data.token);
        localStorage.setItem("userType", userType);

        if (userType === "client") {
          localStorage.setItem("id", data.data[0].ID_clt);
          navigate("/interface-cl");
        } else {
          // For ESN users
          localStorage.setItem("id", data.data[0].ID_ESN);
          navigate("/interface-en");
        }
      } else {
        message.error(data.message || "Identifiants invalides");
      }
    } catch (error) {
      message.error("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  const goToRegister = () => {
    navigate(`/regester?type=${userType}`);
  };

  const goBackToSelection = () => {
    setShowLoginForm(false);
    // Remove type from URL
    window.history.replaceState({}, '', window.location.pathname);
  };

  // Display user type selection cards
  if (!showLoginForm) {
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
        <Space direction="vertical" size="large" style={{ width: "100%", maxWidth: "900px" }}>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <Title level={1}>Bienvenue sur Maghrebit Connect</Title>
            <Text type="secondary">Veuillez choisir votre type de compte</Text>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", justifyContent: "center" }}>
            {/* Client Card */}
            <Card
              hoverable
              style={{ width: 300, textAlign: "center" }}
              cover={
                <div style={{ fontSize: "60px", padding: "20px", color: "#1890ff" }}>
                  <UserOutlined />
                </div>
              }
              onClick={() => selectUserType("client")}
            >
              <Card.Meta
                title="Client Final"
                description="Accédez à votre espace client et gérez vos projets"
              />
              <div style={{ marginTop: "24px" }}>
                <Button type="primary" size="large" block onClick={() => selectUserType("client")}>
                  Continuer
                </Button>
              </div>
            </Card>

            {/* ESN Card */}
            <Card
              hoverable
              style={{ width: 300, textAlign: "center" }}
              cover={
                <div style={{ fontSize: "60px", padding: "20px", color: "#1890ff" }}>
                  <BankOutlined />
                </div>
              }
              onClick={() => selectUserType("societe")}
            >
              <Card.Meta
                title="Prestataire de Service"
                description="Accédez à votre espace prestataire et gérez vos offres"
              />
              <div style={{ marginTop: "24px" }}>
                <Button type="primary" size="large" block onClick={() => selectUserType("societe")}>
                  Continuer
                </Button>
              </div>
            </Card>
          </div>
        </Space>
      </div>
    );
  }

  // Display login form for selected user type
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
          <Title level={2} style={{ marginBottom: "8px" }}>
            {userType === "client" ? "Espace Client" : "Espace Prestataire"}
          </Title>
          <Text type="secondary">Connectez-vous à votre compte</Text>
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
                Vous n'avez pas de compte ?{" "}
                <Link onClick={goToRegister}>S'inscrire</Link>
              </Text>
            </div>
            <div style={{ textAlign: "center" }}>
              <Link onClick={goBackToSelection}>
                Retour à la sélection
              </Link>
            </div>
          </Space>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;