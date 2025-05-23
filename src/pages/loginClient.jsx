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
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { isClientLoggedIn } from "../helper/db";
import { Endponit } from "../helper/enpoint";

const { Title, Text, Link } = Typography;

const LoginClientPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const auth = isClientLoggedIn();
    if (auth === true) {
      navigate("/interface-cl");
    }
  }, [navigate]);

  const handleLogin = async (values) => {
    setLoading(true);

    try {
      const endpoint = Endponit() + "/api/login_client/";

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

        // Store user data
        localStorage.setItem("token", data.token);
        localStorage.setItem("userType", "client");
        localStorage.setItem("id", data.data[0].ID_clt);
        
        navigate("/interface-cl");
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
    navigate("/regester?type=client");
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
          <Title level={2} style={{ marginBottom: "8px" }}>
            Espace Client
          </Title>
          <Text type="secondary">Connectez-vous à votre compte client</Text>
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

export default LoginClientPage;