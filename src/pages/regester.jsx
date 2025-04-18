import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Space,
  Divider,
  Select,
  notification,
  Checkbox,
  Modal,
  Spin,
} from "antd";
import {
  UserOutlined,
  LockOutlined,
  BankOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  MailOutlined,
  IdcardOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Endponit } from "../helper/enpoint";

const { Title, Text, Link } = Typography;
const { Option } = Select;

const PDFViewer = ({ url }) => {
  const [loading, setLoading] = useState(true);

  return (
    <div style={{ width: "100%", height: "60vh", position: "relative" }}>
      {loading && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <Spin size="large" />
        </div>
      )}
      <iframe
        src={`${url}#toolbar=0`}
        width="100%"
        height="100%"
        style={{ border: "none" }}
        onLoad={() => setLoading(false)}
      />
    </div>
  );
};

const SignupPage = () => {
  // Get user type from URL parameters
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const typeFromURL = queryParams.get("type");

  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState(typeFromURL || "client");
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [isTermsModalVisible, setIsTermsModalVisible] = useState(false);
  const [isPrivacyModalVisible, setIsPrivacyModalVisible] = useState(false);
  const [countries, setCountries] = useState([]);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [cities, setCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(false);

  const termsPdfUrl = "../../public/MAGHREB CONNECT IT SOCIÉTÉ.pdf";
  const baseApiUrl = Endponit();

  // Fetch countries from API
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setCountriesLoading(true);
        const response = await axios.get(
          `http://51.38.99.75:3100/api/countries`
        );
        if (response.data.success) {
          setCountries(response.data.data);
        } else {
          notification.error({
            message: "Erreur",
            description: "Impossible de charger la liste des pays.",
          });
        }
      } catch (error) {
        console.error("Failed to fetch countries:", error);
        notification.error({
          message: "Erreur",
          description: "Impossible de charger la liste des pays.",
        });
      } finally {
        setCountriesLoading(false);
      }
    };

    fetchCountries();
  }, [baseApiUrl]);

  // Fetch cities when country changes
  const fetchCities = async (country) => {
    if (!country) {
      setCities([]);
      return;
    }

    try {
      setCitiesLoading(true);
      const response = await axios.get(
        `http://51.38.99.75:3100/api/cities/${country}`
      );
      if (response.data.success) {
        setCities([]);
        setCities(response.data.data || []);
      } else {
        notification.warning({
          message: "Avertissement",
          description: `Impossible de charger les villes pour ${country}.`,
        });
        setCities([]);
      }
    } catch (error) {
      console.error(`Failed to fetch cities for ${country}:`, error);
      notification.error({
        message: "Erreur",
        description: `Impossible de charger les villes pour ${country}.`,
      });
      setCities([]);
    } finally {
      setCitiesLoading(false);
    }
  };

  const handleCountryChange = (value) => {
    form.setFieldsValue({ ville: undefined }); // Reset city when country changes
    fetchCities(value);
  };

  const privacyContent = `
    Protection des Données Personnelles

    1. Engagement de confidentialité
    - Protection stricte des données personnelles
    - Respect des dispositions de la Politique de Confidentialité
    - Obtention du consentement explicite pour l'utilisation des données

    2. Responsabilités
    - Exactitude des données fournies
    - Mise à jour régulière des informations
    - Protection des données personnelles des utilisateurs

    3. Durée de conservation
    - Conservation des données pendant la durée nécessaire
    - Suppression sécurisée des données obsolètes
    - Respect des délais légaux de conservation
    `;

  const onFinish = async (values) => {
    if (!values.acceptConditions) {
      notification.error({
        message: "Erreur",
        description: "Vous devez accepter les conditions pour créer un compte.",
      });
      return;
    }

    setLoading(true);

    try {
      // Prepare data based on user type
      const registrationData =
        userType === "client"
          ? {
              raison_sociale: values.raison_sociale,
              siret: values.siret,
              rce: values.rce,
              pays: values.pays,
              adresse: values.adresse,
              cp: values.cp,
              ville: values.ville,
              province: values.province,
              mail_contact: values.mail_contact,
              password: values.password,
              tel_contact: values.tel_contact,
              statut: "Draft", // Default status
              n_tva: values.n_tva,
              iban: values.iban,
              bic: values.bic,
              banque: values.banque,
              responsible: values.responsible,
            }
          : {
              Raison_sociale: values.raisonSociale,
              email: values.emailPro,
              phone: values.telephone,
              password: values.password,
              Adresse: values.adresse,
              city: values.ville,
              country: values.pays,
              mail_Contact: values.emailPro,
              CP: "00000",
              Statut: "Draft",
            };

      // Choose endpoint based on user type
      const endpoint = userType === "client" ? "/api/client/" : "/api/ESN/";

      // Send registration request
      const response = await axios.post(
        baseApiUrl + endpoint,
        registrationData
      );

      notification.success({
        message: "Inscription réussie",
        description: "Votre compte a été créé avec succès!",
      });

      // Navigate to login with user type
      navigate(`/login?type=${userType}`);
    } catch (error) {
      // Enhanced error handling
      console.error("Registration error:", error);

      if (error.response && error.response.data) {
        const errorData = error.response.data;

        // Handle specific validation errors
        if (errorData.errors) {
          // Check for SIRET duplication error
          if (
            errorData.errors.siret &&
            errorData.errors.siret.includes(
              "client with this Numéro SIRET already exists"
            )
          ) {
            // Mark the SIRET field as error
            form.setFields([
              {
                name: "siret",
                errors: ["Un compte avec ce numéro SIRET existe déjà."],
                value: form.getFieldValue("siret"),
              },
            ]);

            notification.error({
              message: "Erreur d'inscription",
              description:
                "Un compte avec ce numéro SIRET existe déjà. Veuillez utiliser un autre numéro ou vous connecter avec ce compte.",
            });
            return;
          }

          // Translation map for common field names
          const fieldTranslations = {
            siret: "Numéro SIRET",
            raison_sociale: "Raison sociale",
            mail_contact: "Email de contact",
            email: "Email",
            password: "Mot de passe",
            tel_contact: "Téléphone",
            adresse: "Adresse",
            ville: "Ville",
            pays: "Pays",
            // Add more field translations as needed
          };

          // Mark all fields with errors in the form
          const fieldErrors = {};
          for (const [field, messages] of Object.entries(errorData.errors)) {
            const fieldName = fieldTranslations[field] || field;
            const errorMessage = Array.isArray(messages)
              ? messages[0].includes("already exists")
                ? `Un ${fieldName} identique existe déjà dans notre système.`
                : messages[0]
              : messages.includes("already exists")
              ? `Un ${fieldName} identique existe déjà dans notre système.`
              : messages;

            // Set field error state in the form
            form.setFields([
              {
                name: field,
                errors: [errorMessage],
                value: form.getFieldValue(field),
              },
            ]);

            // Display error notification
            notification.error({
              message: `Erreur: ${fieldName}`,
              description: errorMessage,
            });
          }
        } else if (errorData.status === false && errorData.msg) {
          // Handle generic error message with better French translation
          notification.error({
            message: "Échec de l'inscription",
            description:
              errorData.msg === "Failed to Add"
                ? "Échec de l'ajout du compte. Veuillez vérifier vos informations."
                : errorData.msg,
          });
        } else {
          // Fallback error message
          notification.error({
            message: "Erreur d'inscription",
            description:
              "Une erreur est survenue lors de l'inscription. Veuillez réessayer.",
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (_, value) => {
    if (!value) {
      return Promise.reject("Veuillez saisir votre mot de passe!");
    }
    if (value.length < 8) {
      return Promise.reject(
        "Le mot de passe doit contenir au moins 8 caractères!"
      );
    }
    if (!/[A-Z]/.test(value)) {
      return Promise.reject(
        "Le mot de passe doit contenir au moins une majuscule!"
      );
    }
    if (!/[0-9]/.test(value)) {
      return Promise.reject(
        "Le mot de passe doit contenir au moins un chiffre!"
      );
    }
    return Promise.resolve();
  };

  const goToLogin = () => {
    navigate(`/login?type=${userType}`);
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
          maxWidth: "500px",
          width: "100%",
          boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <Title level={2} style={{ marginBottom: "8px" }}>
            {userType === "client" 
              ? "Inscription - Espace Client" 
              : "Inscription - Espace Prestataire"}
          </Title>
          <Text type="secondary">Rejoignez-nous dès aujourd'hui</Text>
        </div>

        <Modal
          title="Conditions Générales"
          open={isTermsModalVisible}
          onOk={() => setIsTermsModalVisible(false)}
          onCancel={() => setIsTermsModalVisible(false)}
          width={800}
          footer={[
            <Button
              key="submit"
              type="primary"
              onClick={() => setIsTermsModalVisible(false)}
            >
              J'ai lu et je comprends
            </Button>,
          ]}
        >
          <PDFViewer url={termsPdfUrl} />
        </Modal>

        <Modal
          title="Politique de Confidentialité"
          open={isPrivacyModalVisible}
          onOk={() => setIsPrivacyModalVisible(false)}
          onCancel={() => setIsPrivacyModalVisible(false)}
          width={800}
          footer={[
            <Button
              key="submit"
              type="primary"
              onClick={() => setIsPrivacyModalVisible(false)}
            >
              J'ai lu et je comprends
            </Button>,
          ]}
        >
          <div
            style={{
              maxHeight: "60vh",
              overflow: "auto",
              whiteSpace: "pre-line",
            }}
          >
            {privacyContent}
          </div>
        </Modal>

        <Form
          form={form}
          name="signup"
          onFinish={onFinish}
          layout="vertical"
          requiredMark="optional"
        >
          {userType === "client" ? (
            // CLIENT REGISTRATION FORM - REORDERED FIELDS
            <>
              {/* Company Information */}
              <div className="form-section">
                <Title level={5} style={{ marginBottom: "16px", marginTop: "8px" }}>
                  Informations de l'entreprise
                </Title>
                
                <Form.Item
                  name="raison_sociale"
                  rules={[
                    {
                      required: true,
                      message: "Veuillez saisir votre raison sociale!",
                    },
                  ]}
                >
                  <Input prefix={<UserOutlined />} placeholder="Raison sociale *" />
                </Form.Item>
                
                <Form.Item
                  name="siret"
                  rules={[
                    {
                      required: true,
                      message: "Veuillez saisir votre numéro SIRET!",
                    },
                  ]}
                >
                  <Input prefix={<IdcardOutlined />} placeholder="Numéro SIRET *" />
                </Form.Item>
                
                <Space size="middle">
                  <Form.Item 
                    name="rce"
                    rules={[
                      {
                        required: true,
                        message: "Veuillez saisir votre RCE!",
                      },
                    ]}
                  >
                    <Input placeholder="RCE *" />
                  </Form.Item>
                  <Form.Item 
                    name="n_tva"
                    rules={[
                      {
                        required: true,
                        message: "Veuillez saisir votre numéro de TVA!",
                      },
                    ]}
                  >
                    <Input placeholder="Numéro de TVA *" />
                  </Form.Item>
                </Space>
              </div>
              
              {/* Contact Information */}
              <div className="form-section">
                <Title level={5} style={{ marginBottom: "16px", marginTop: "16px" }}>
                  Coordonnées
                </Title>
                
                <Form.Item
                  name="mail_contact"
                  rules={[
                    { required: true, message: "Veuillez saisir votre email!" },
                    { type: "email", message: "Email invalide!" },
                  ]}
                >
                  <Input
                    prefix={<MailOutlined />}
                    placeholder="Email de contact *"
                  />
                </Form.Item>
                
                <Form.Item
                  name="tel_contact"
                  rules={[
                    {
                      required: true,
                      message: "Veuillez saisir votre numéro de téléphone!",
                    },
                  ]}
                >
                  <Input
                    prefix={<PhoneOutlined />}
                    placeholder="Téléphone de contact *"
                  />
                </Form.Item>
              </div>
              
              {/* Address Information */}
              <div className="form-section">
                <Title level={5} style={{ marginBottom: "16px", marginTop: "16px" }}>
                  Adresse
                </Title>
                
                <Form.Item
                  name="adresse"
                  rules={[
                    { required: true, message: "Veuillez saisir votre adresse!" },
                  ]}
                >
                  <Input prefix={<EnvironmentOutlined />} placeholder="Adresse *" />
                </Form.Item>
                
                <Form.Item
                  name="pays"
                  rules={[
                    {
                      required: true,
                      message: "Veuillez sélectionner votre pays!",
                    },
                  ]}
                >
                  <div style={{ position: "relative" }}>
                    {countriesLoading && (
                      <div
                        style={{
                          position: "absolute",
                          right: "10px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          zIndex: 1,
                        }}
                      >
                        <Spin size="small" />
                      </div>
                    )}
                    <select
                      className="ant-input"
                      style={{
                        width: "100%",
                        height: "32px",
                        padding: "4px 11px",
                        color: "rgba(0, 0, 0, 0.85)",
                        border: "1px solid #d9d9d9",
                        borderRadius: "2px",
                        backgroundColor: "#fff",
                      }}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      disabled={countriesLoading}
                    >
                      <option value="">Sélectionnez votre pays *</option>
                      {countries.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                  </div>
                </Form.Item>
                
                <Form.Item
                  name="ville"
                  rules={[
                    {
                      required: true,
                      message: "Veuillez sélectionner votre ville!",
                    },
                  ]}
                >
                  <div style={{ position: "relative" }}>
                    {citiesLoading && (
                      <div
                        style={{
                          position: "absolute",
                          right: "10px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          zIndex: 1,
                        }}
                      >
                        <Spin size="small" />
                      </div>
                    )}
                    <select
                      className="ant-input"
                      style={{
                        width: "100%",
                        height: "32px",
                        padding: "4px 11px",
                        color: "rgba(0, 0, 0, 0.85)",
                        border: "1px solid #d9d9d9",
                        borderRadius: "2px",
                        backgroundColor: "#fff",
                      }}
                      disabled={!form.getFieldValue("pays") || citiesLoading}
                    >
                      <option value="">
                        {!form.getFieldValue("pays")
                          ? "Veuillez d'abord sélectionner un pays"
                          : citiesLoading
                          ? "Chargement des villes..."
                          : cities.length === 0
                          ? "Aucune ville disponible pour ce pays"
                          : "Sélectionnez votre ville *"}
                      </option>
                      {cities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>
                </Form.Item>
                
                <Space style={{ width: "100%" }} size="middle">
                  <Form.Item 
                    name="cp"
                    rules={[
                      {
                        required: true,
                        message: "Veuillez saisir votre code postal!",
                      },
                    ]}
                  >
                    <Input placeholder="Code postal *" />
                  </Form.Item>
                  <Form.Item 
                    name="province"
                    rules={[
                      {
                        required: true,
                        message: "Veuillez saisir votre province!",
                      },
                    ]}
                  >
                    <Input placeholder="Province *" />
                  </Form.Item>
                </Space>
              </div>
              
              {/* Account Security */}
              <div className="form-section">
                <Title level={5} style={{ marginBottom: "16px", marginTop: "16px" }}>
                  Sécurité du compte
                </Title>
                
                <Space style={{ width: "100%" }} size="middle">
                  <Form.Item
                    name="password"
                    style={{ width: "100%" }}
                    rules={[{ validator: validatePassword }]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="Mot de passe *"
                    />
                  </Form.Item>
                  <Form.Item
                    name="confirmPassword"
                    style={{ width: "100%" }}
                    dependencies={["password"]}
                    rules={[
                      {
                        required: true,
                        message: "Veuillez confirmer votre mot de passe!",
                      },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue("password") === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(
                            "Les mots de passe ne correspondent pas!"
                          );
                        },
                      }),
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="Confirmer le mot de passe *"
                    />
                  </Form.Item>
                </Space>
              </div>
            </>
          ) : (
            // ESN REGISTRATION FORM - REORDERED FIELDS
            <>
              {/* Company Information */}
              <div className="form-section">
                <Title level={5} style={{ marginBottom: "16px", marginTop: "8px" }}>
                  Informations de la société
                </Title>
                
                <Form.Item
                  name="raisonSociale"
                  rules={[
                    {
                      required: true,
                      message: "Veuillez saisir la raison sociale!",
                    },
                  ]}
                >
                  <Input prefix={<BankOutlined />} placeholder="Raison sociale *" />
                </Form.Item>
              </div>
              
              {/* Contact Information */}
              <div className="form-section">
                <Title level={5} style={{ marginBottom: "16px", marginTop: "16px" }}>
                  Coordonnées
                </Title>
                
                <Form.Item
                  name="emailPro"
                  rules={[
                    {
                      required: true,
                      message: "Veuillez saisir l'email professionnel!",
                    },
                    { type: "email", message: "Email invalide!" },
                  ]}
                >
                  <Input
                    prefix={<MailOutlined />}
                    placeholder="Email professionnel *"
                  />
                </Form.Item>
                
                <Form.Item
                  name="telephone"
                  rules={[
                    {
                      required: true,
                      message: "Veuillez saisir votre numéro de téléphone!",
                    },
                  ]}
                >
                  <Input prefix={<PhoneOutlined />} placeholder="Téléphone *" />
                </Form.Item>
              </div>
              
              {/* Address Information */}
              <div className="form-section">
                <Title level={5} style={{ marginBottom: "16px", marginTop: "16px" }}>
                  Adresse
                </Title>
                
                <Form.Item
                  name="adresse"
                  rules={[
                    { required: true, message: "Veuillez saisir votre adresse!" },
                  ]}
                >
                  <Input prefix={<EnvironmentOutlined />} placeholder="Adresse *" />
                </Form.Item>
                
                <Form.Item
                  name="pays"
                  rules={[
                    {
                      required: true,
                      message: "Veuillez sélectionner votre pays!",
                    },
                  ]}
                >
                  <Select
                    placeholder="Sélectionnez votre pays *"
                    loading={countriesLoading}
                    showSearch
                    filterOption={(input, option) =>
                      option.children
                        .toLowerCase()
                        .indexOf(input.toLowerCase()) >= 0
                    }
                    onChange={handleCountryChange}
                    notFoundContent={
                      countriesLoading ? <Spin size="small" /> : null
                    }
                  >
                    {countries.map((country) => (
                      <Option key={country} value={country}>
                        {country}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                
                <Form.Item
                  name="ville"
                  rules={[
                    {
                      required: true,
                      message: "Veuillez sélectionner votre ville!",
                    },
                  ]}
                >
                  <Select
                    placeholder="Sélectionnez votre ville *"
                    loading={citiesLoading}
                    showSearch
                    filterOption={(input, option) =>
                      option.children
                        .toLowerCase()
                        .indexOf(input.toLowerCase()) >= 0
                    }
                    disabled={!form.getFieldValue("pays")}
                    notFoundContent={
                      citiesLoading ? (
                        <Spin size="small" />
                      ) : (
                        cities.length === 0 && "Aucune ville disponible"
                      )
                    }
                  >
                    {cities.map((city) => (
                      <Option key={city} value={city}>
                        {city}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>
              
              {/* Account Security */}
              <div className="form-section">
                <Title level={5} style={{ marginBottom: "16px", marginTop: "16px" }}>
                  Sécurité du compte
                </Title>
                
                <Space style={{ width: "100%" }} size="middle">
                  <Form.Item
                    name="password"
                    style={{ width: "100%" }}
                    rules={[{ validator: validatePassword }]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="Mot de passe *"
                    />
                  </Form.Item>
                  <Form.Item
                    name="confirmPassword"
                    style={{ width: "100%" }}
                    dependencies={["password"]}
                    rules={[
                      {
                        required: true,
                        message: "Veuillez confirmer votre mot de passe!",
                      },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue("password") === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(
                            "Les mots de passe ne correspondent pas!"
                          );
                        },
                      }),
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="Confirmer le mot de passe *"
                    />
                  </Form.Item>
                </Space>
              </div>
            </>
          )}

          <Form.Item
            name="acceptConditions"
            valuePropName="checked"
            rules={[
              {
                validator: (_, value) =>
                  value
                    ? Promise.resolve()
                    : Promise.reject(
                        "Veuillez accepter les conditions pour continuer"
                      ),
              },
            ]}
          >
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox />
                <Text>
                  J'accepte les{" "}
                  <Link
                    onClick={(e) => {
                      e.preventDefault();
                      setIsTermsModalVisible(true);
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    conditions générales
                  </Link>{" "}
                  et la{" "}
                  <Link
                    onClick={(e) => {
                      e.preventDefault();
                      setIsPrivacyModalVisible(true);
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    politique de confidentialité
                  </Link>
                </Text>
              </div>
            </div>
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
              S'inscrire
            </Button>
          </Form.Item>

          <Divider plain>
            <Text type="secondary">OU</Text>
          </Divider>

          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            <div style={{ textAlign: "center" }}>
              <Text type="secondary">
                Vous avez déjà un compte ?{" "}
                <Link onClick={goToLogin}>Se connecter</Link>
              </Text>
            </div>
          </Space>
        </Form>
      </Card>
    </div>
  );
};

export default SignupPage;