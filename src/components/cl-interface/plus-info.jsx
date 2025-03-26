import React, { useState, useCallback, useEffect } from "react";
import {
  Card,
  Button,
  Avatar,
  Form,
  Input,
  DatePicker,
  Row,
  Col,
  Upload,
  message,
  Select,
  Switch,
} from "antd";
import {
  EditOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  BankOutlined,
  UploadOutlined,
  SaveOutlined,
  CloseOutlined,
  LinkedinOutlined,
  GithubOutlined,
  TwitterOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import axios from "axios";
import { Endponit, token } from "../../helper/enpoint";

const { TextArea } = Input;
const { Option } = Select;

const ClientPlusInfo = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();
  const [img_path, setimg_path] = useState("");
  const [privacySettings, setPrivacySettings] = useState({
    showEmail: true,
    showPhone: false,
    showLocation: true,
  });
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetchClientData();
  }, []);

  const fetchClientData = async () => {
    const id = localStorage.getItem("id");

    try {
      const response = await axios.get(`${Endponit()}/api/getUserData`, {
        headers: {
          Authorization: `Bearer ${token()}`,
        },
        params: {
          clientId: id,
        },
      });
      
      const client = response.data.data;

      const profileData = {
        id: client[0].ID_clt,
        img_path: client[0].img_path,
        raison_sociale: client[0].raison_sociale || "",
        email: client[0].mail_contact,
        phone: client[0].tel_contact || "",
        address: client[0].adresse || "",
        occupation: client[0].statut || "",
        birthDate: client[0].date_validation ? dayjs(client[0].date_validation) : null,
        bio: client[0].rce || "",
        industry: client[0].pays || "",
        socialLinks: {
          linkedin: client[0].linkedin || "",
          twitter: client[0].twitter || "",
          website: client[0].website || "",
        },
      };

      setProfile(profileData);
      form.setFieldsValue({
        ...profileData,
        ...profileData.socialLinks,
      });
      
    } catch (error) {
      console.error("Error fetching client data:", error);
      message.error("Une erreur s'est produite lors du chargement des données du client.");
    }
  };

  const handlePrivacyToggle = (setting) => {
    setPrivacySettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
    message.info(`Visibilité de ${setting.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())} mise à jour`);
  };

  const handleEdit = useCallback(() => {
    if (isEditing) {
      form.validateFields()
        .then(async (values) => {
          const updatedProfile = {
            ID_clt: profile.id,
            raison_sociale: values.raison_sociale,
            mail_contact: values.email,
            tel_contact: values.phone || "",
            adresse: values.address || "",
            statut: values.occupation || "",
            date_validation: values.birthDate ? values.birthDate.format("YYYY-MM-DD") : null,
            rce: values.bio || "",
            pays: values.industry || "",
            linkedin: values.linkedin || "",
            twitter: values.twitter || "",
            website: values.website || "",
            img_path: img_path || profile.img_path,
            password: null,
          };

          try {
            await axios.put(
              `${Endponit()}/api/client/`,
              updatedProfile,
              {
                headers: {
                  Authorization: `Bearer ${token()}`,
                },
              }
            );

            setProfile({
              ...profile,
              ...updatedProfile,
              birthDate: values.birthDate,
              socialLinks: {
                linkedin: values.linkedin || "",
                twitter: values.twitter || "",
                website: values.website || "",
              },
            });
            
            setIsEditing(false);
            message.success("Profil mis à jour avec succès");
          } catch (error) {
            console.error("Error updating client data:", error);
            message.error("Une erreur s'est produite lors de la mise à jour du profil.");
          }
        })
        .catch((error) => {
          message.error("Veuillez vérifier les champs requis");
        });
    } else {
      setIsEditing(true);
    }
  }, [form, isEditing, profile, img_path]);

  const handleCancelEdit = () => {
    form.setFieldsValue({
      ...profile,
      ...profile.socialLinks,
    });
    setIsEditing(false);
  };

  const handleProfileImageUpload = async (info) => {
    const file = info.file;
    const isImage = file.type.startsWith("image/");
    const isLt2M = file.size / 1024 / 1024 < 2;

    if (!isImage) {
      message.error("Vous ne pouvez télécharger que des fichiers image!");
      return;
    }

    if (!isLt2M) {
      message.error("L'image doit être inférieure à 2MB!");
      return;
    }

    const formData = new FormData();
    formData.append("uploadedFile", file.originFileObj);
    formData.append("path", "./upload/profile/");

    try {
      const uploadResponse = await axios.post(
        `${Endponit()}/api/saveDoc/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token()}`,
          },
        }
      );

      const imagePath = uploadResponse.data.path;
      setimg_path(imagePath);
      setProfile(prev => ({ ...prev, img_path: imagePath }));
    } catch (error) {
      console.error("Upload Error:", error);
      message.error("Erreur lors du téléchargement de l'image");
    }
  };
  
  return profile ? (
    <div className="w-full mx-auto p-6 bg-gradient-to-br from-blue-50 to-blue-100">
      <Card
        className="shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl"
        bodyStyle={{ padding: 0 }}
      >
        {/* En-tête avec Progression et Actions de Modification */}
        <div className="p-6 bg-white flex justify-between items-center border-b border-blue-100">
          <div className="w-full mr-4">
            {/* <Tooltip title={`Profil ${profile.completionStatus}% Complété`}>
              <Progress
                percent={profile.completionStatus}
                status={profile.completionStatus === 100 ? "success" : "active"}
                strokeColor={{
                  "0%": "#108ee9",
                  "100%": "#87d068",
                }}
                strokeWidth={10}
                className="w-full"
              />
            </Tooltip>  */}
          </div>
          <div className="flex space-x-2">
            {isEditing ? (
              <>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleEdit}
                  className="transition-transform hover:scale-105"
                >
                  Enregistrer
                </Button>
                <Button
                  icon={<CloseOutlined />}
                  onClick={handleCancelEdit}
                  className="transition-transform hover:scale-105"
                >
                  Annuler
                </Button>
              </>
            ) : (
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={handleEdit}
                className="transition-transform hover:scale-105"
              >
                Modifier le Profil
              </Button>
            )}
          </div>
        </div>

        {/* Contenu du Profil */}
        <Row gutter={0} className="p-6">
          {/* Colonne de Gauche - Photo et Confidentialité */}
          <Col xs={24} md={8} className="border-r border-blue-100 pr-6">
            <div className="flex flex-col items-center">
              <Avatar
                size={180}
                src={
                  profile.img_path
                    ? `${Endponit()}/media/${profile.img_path}`
                    : undefined
                }
                // icon={!profile.img_path && <UserOutlined />}
                className="mb-4 border-4 border-blue-500 shadow-lg"
              />
              <Upload
                name="avatar"
                listType="picture"
                className="avatar-uploader"
                showUploadList={false}
                beforeUpload={(file) => {
                  // Image type validation
                  const isImage = file.type.startsWith("image/");
                  if (!isImage) {
                    message.error(
                      "Vous ne pouvez télécharger que des fichiers image!"
                    );
                    return false;
                  }

                  // File size validation
                  const isLt2M = file.size / 1024 / 1024 < 2;
                  if (!isLt2M) {
                    message.error("L'image doit être inférieure à 2MB!");
                    return false;
                  }

                  return isImage && isLt2M;
                }}
                onChange={handleProfileImageUpload}
              >
                <Button
                  icon={<UploadOutlined />}
                  type="dashed"
                  // disabled={!isEditing}
                  className="mb-4"
                >
                  Changer de Photo
                </Button>
              </Upload>

              {/* Paramètres de Confidentialité */}
              <div className="w-full bg-blue-50 p-4 rounded-lg shadow-inner">
                <h4 className="text-center mb-4 font-semibold text-blue-800">
                  Contrôles de Confidentialité
                </h4>
                <div className="space-y-3">
                  {Object.entries(privacySettings).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex justify-between items-center"
                    >
                      <span className="text-blue-700">
                        {key
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (str) => str.toUpperCase())}
                      </span>
                      <Switch
                        checked={value}
                        onChange={() => handlePrivacyToggle(key)}
                        className="bg-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Col>

          {/* Colonne de Droite - Informations */}
          <Col xs={24} md={16} className="pl-6">
            <Form
              form={form}
              layout="vertical"
              disabled={!isEditing}
              className="space-y-4"
            >
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="raison_sociale"
                    label="Raison social"
                    rules={[
                      {
                        required: true,
                        message: "Veuillez entrer votre raison sociale",
                      },
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined />}
                      placeholder="Raison social"
                      className="rounded-lg"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="email"
                label="E-mail"
                rules={[
                  { required: true, message: "Veuillez entrer votre e-mail" },
                  {
                    type: "email",
                    message: "Veuillez entrer un e-mail valide",
                  },
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="E-mail"
                  className="rounded-lg"
                />
              </Form.Item>

              <Form.Item name="phone" label="Téléphone">
                <Input
                  prefix={<PhoneOutlined />}
                  placeholder="Numéro de Téléphone"
                  className="rounded-lg"
                />
              </Form.Item>

              <Form.Item name="address" label="Adresse">
                <Input
                  prefix={<HomeOutlined />}
                  placeholder="Adresse"
                  className="rounded-lg"
                />
              </Form.Item>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item name="occupation" label="Profession">
                    <Input
                      prefix={<BankOutlined />}
                      placeholder="Profession"
                      className="rounded-lg"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="industry" label="Secteur d'Activité">
                    <Select
                      placeholder="Sélectionner un Secteur"
                      className="w-full"
                    >
                      <Option value="Technology">Technologie</Option>
                      <Option value="Finance">Finance</Option>
                      <Option value="Healthcare">Santé</Option>
                      <Option value="Education">Éducation</Option>
                      <Option value="Other">Autre</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="birthDate" label="Date de Naissance">
                <DatePicker
                  style={{ width: "100%" }}
                  format="YYYY-MM-DD"
                  placeholder="Sélectionner la Date de Naissance"
                  className="rounded-lg w-full"
                />
              </Form.Item>

              <Form.Item name="bio" label="Biographie">
                <TextArea
                  rows={4}
                  placeholder="Parlez-nous de vous"
                  className="rounded-lg"
                />
              </Form.Item>

              <div className="space-y-4">
                <Form.Item name="linkedin" label="LinkedIn">
                  <Input
                    prefix={<LinkedinOutlined />}
                    placeholder="URL LinkedIn"
                    className="rounded-lg"
                  />
                </Form.Item>

                <Form.Item name="twitter" label="Twitter">
                  <Input
                    prefix={<TwitterOutlined />}
                    placeholder="URL Twitter"
                    className="rounded-lg"
                  />
                </Form.Item>

                <Form.Item name="website" label="Site Web">
                  <Input
                    prefix={<GlobalOutlined />}
                    placeholder="URL Site Web"
                    className="rounded-lg"
                  />
                </Form.Item>
              </div>
            </Form>
          </Col>
        </Row>
      </Card>
    </div>
  ) : (
    <div>Loading...</div>
  );
};

export default ClientPlusInfo;
