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
  Radio,
  message,
} from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { isClientLoggedIn, isEsnLoggedIn } from "../helper/db";
import { Endponit } from "../helper/enpoint";

const { Title, Text, Link } = Typography;

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState("client");
  const navigate = useNavigate();

  useEffect(() => {
    {
      const auth = isEsnLoggedIn();
      const auth2 = isClientLoggedIn();
      if (auth == true) {
        navigate("/interface-en");
      } else if (auth2 == true) {
        navigate("/interface-cl");
      }
    }
  }, []);

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
          // localStorage.setItem("esnName", data.data[0].Nom_ESN);
          // localStorage.setItem("siret", data.data[0].SIRET);
          navigate("/interface-en"); // Adjust this route as needed
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
            Bienvenue
          </Title>
          <Text type="secondary">Connectez-vous à votre compte</Text>
        </div>

        <div style={{ marginBottom: "24px" }}>
          <Radio.Group
            value={userType}
            onChange={(e) => setUserType(e.target.value)}
            buttonStyle="solid"
            style={{ width: "100%" }}
          >
            <Radio.Button
              value="client"
              style={{ width: "50%", textAlign: "center" }}
            >
              Client final
            </Radio.Button>
            <Radio.Button
              value="societe"
              style={{ width: "50%", textAlign: "center" }}
            >
              Prestataire de service
            </Radio.Button>
          </Radio.Group>
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
              placeholder={
                userType === "client" ? "Adresse email" : "Adresse email"
              }
              // maxLength={userType === "client" ? undefined : 14}
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
                <Link
                  onClick={() => {
                    navigate("/regester");
                  }}
                >
                  S'inscrire
                </Link>
              </Text>
            </div>
          </Space>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;
