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
import axios from "axios"; // Make sure to install axios: npm install axios
import { Endponit } from "../helper/enpoint";
import { isAdminLoggedIn, isClientLoggedIn, isEsnLoggedIn } from "../helper/db";

const { Title, Text, Link } = Typography;

const AdminLoginPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is ESN or client
    if (isEsnLoggedIn()) {
      message.error("ESN users cannot access admin login");
      navigate("/interface-en");
      return;
    }

    if (isClientLoggedIn()) {
      message.error("Client users cannot access admin login");
      navigate("/interface-cl");
      return;
    }
  }, [navigate]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await axios.post(Endponit() + "/api/admin/login/", {
        username: values.username,
        mdp: values.password,
      });

      if (response.data.success) {
        // Store the token in localStorage or sessionStorage
        localStorage.setItem("adminToken", response.data.token);
        localStorage.setItem("adminId", response.data.data[0].ID_Admin);

        // Show success message
        message.success("Connexion réussie");

        // Navigate to admin dashboard (adjust route as needed)
        navigate("/interface-ad");
      } else {
        // Handle login failure
        message.error("Échec de la connexion. Vérifiez vos identifiants.");
      }
    } catch (error) {
      // Handle network or other errors
      message.error("Une erreur est survenue lors de la connexion");
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1a1c1f 0%, #2d3436 100%)",
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
            "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <Title level={2} style={{ marginBottom: "8px" }}>
            Administration
          </Title>
          <Text type="secondary">Accès au panneau d'administration</Text>
        </div>

        <Form
          name="admin_login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          size="large"
          layout="vertical"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: "Veuillez saisir votre identifiant!" },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Identifiant administrateur (email)"
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
                background: "#001529",
              }}
            >
              Connexion administrateur
            </Button>
          </Form.Item>

          <Divider plain>
            <Text type="secondary">Sécurité</Text>
          </Divider>

          <div style={{ textAlign: "center" }}>
            <Text type="secondary">
              Cette interface est réservée aux administrateurs.
              <br />
              <Link
                onClick={() => {
                  navigate("/");
                }}
              >
                Retour à l'accueil
              </Link>
            </Text>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default AdminLoginPage;
