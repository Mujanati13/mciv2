// Signup.jsx
import React, { useState } from 'react';
import {
    Form,
    Input,
    Button,
    Card,
    Typography,
    Space,
    Divider,
    Radio,
    Select,
    DatePicker,
    notification,
    Checkbox
} from 'antd';
import {
    UserOutlined,
    LockOutlined,
    BankOutlined,
    PhoneOutlined,
    EnvironmentOutlined,
    IdcardOutlined,
    MailOutlined
} from '@ant-design/icons';
import { NavLink } from 'react-router-dom';
import { useNavigate } from "react-router-dom";

const { Title, Text, Link } = Typography;
const { Option } = Select;

const SignupPage = () => {
    const [loading, setLoading] = useState(false);
    const [userType, setUserType] = useState('client');
    const [form] = Form.useForm();
    const navigate = useNavigate();

    const onFinish = (values) => {
        setLoading(true);
        console.log('Succès:', { ...values, userType });
        // Simulation d'appel API
        setTimeout(() => {
            setLoading(false);
            notification.success({
                message: 'Inscription réussie',
                description: 'Votre compte a été créé avec succès!',
            });
        }, 1000);
    };

    // Configuration de validation du mot de passe
    const validatePassword = (_, value) => {
        if (!value) {
            return Promise.reject('Veuillez saisir votre mot de passe!');
        }
        if (value.length < 8) {
            return Promise.reject('Le mot de passe doit contenir au moins 8 caractères!');
        }
        if (!/[A-Z]/.test(value)) {
            return Promise.reject('Le mot de passe doit contenir au moins une majuscule!');
        }
        if (!/[0-9]/.test(value)) {
            return Promise.reject('Le mot de passe doit contenir au moins un chiffre!');
        }
        return Promise.resolve();
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <Card
                style={{
                    maxWidth: '500px',
                    width: '100%',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <Title level={2} style={{ marginBottom: '8px' }}>Créer un compte</Title>
                    <Text type="secondary">Rejoignez-nous dès aujourd'hui</Text>
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <Radio.Group
                        value={userType}
                        onChange={(e) => {
                            setUserType(e.target.value);
                            form.resetFields();
                        }}
                        buttonStyle="solid"
                        style={{ width: '100%' }}
                    >
                        <Radio.Button
                            value="client"
                            style={{ width: '50%', textAlign: 'center' }}
                        >
                            Client
                        </Radio.Button>
                        <Radio.Button
                            value="societe"
                            style={{ width: '50%', textAlign: 'center' }}
                        >
                            Société
                        </Radio.Button>
                    </Radio.Group>
                </div>

                <Form
                    form={form}
                    name="signup"
                    onFinish={onFinish}
                    layout="vertical"
                    requiredMark="optional"
                >
                    {userType === 'client' ? (
                        // Formulaire Client
                        <>
                            <Space style={{ width: '100%' }} size="middle">
                                <Form.Item
                                    name="prenom"
                                    style={{ width: '100%' }}
                                    rules={[{ required: true, message: 'Veuillez saisir votre prénom!' }]}
                                >
                                    <Input prefix={<UserOutlined />} placeholder="Prénom" />
                                </Form.Item>

                                <Form.Item
                                    name="nom"
                                    style={{ width: '100%' }}
                                    rules={[{ required: true, message: 'Veuillez saisir votre nom!' }]}
                                >
                                    <Input prefix={<UserOutlined />} placeholder="Nom" />
                                </Form.Item>
                            </Space>

                            <Form.Item
                                name="dateNaissance"
                                rules={[{ required: true, message: 'Veuillez saisir votre date de naissance!' }]}
                            >
                                <DatePicker
                                    style={{ width: '100%' }}
                                    placeholder="Date de naissance"
                                    format="DD/MM/YYYY"
                                />
                            </Form.Item>

                            <Form.Item
                                name="email"
                                rules={[
                                    { required: true, message: 'Veuillez saisir votre email!' },
                                    { type: 'email', message: 'Email invalide!' }
                                ]}
                            >
                                <Input prefix={<MailOutlined />} placeholder="Email" />
                            </Form.Item>
                        </>
                    ) : (
                        // Formulaire Société
                        <>
                            <Form.Item
                                name="raisonSociale"
                                rules={[{ required: true, message: 'Veuillez saisir la raison sociale!' }]}
                            >
                                <Input prefix={<BankOutlined />} placeholder="Raison sociale" />
                            </Form.Item>

                            {/* <Form.Item
                                name="siret"
                                rules={[
                                    { required: true, message: 'Veuillez saisir le numéro SIRET!' },
                                    { len: 14, message: 'Le SIRET doit contenir 14 chiffres!' }
                                ]}
                            >
                                <Input prefix={<IdcardOutlined />} placeholder="Numéro SIRET" maxLength={14} />
                            </Form.Item> */}

                            {/* <Form.Item
                                name="tva"
                                rules={[{ required: true, message: 'Veuillez saisir le numéro de TVA!' }]}
                            >
                                <Input prefix={<IdcardOutlined />} placeholder="Numéro de TVA" />
                            </Form.Item> */}

                            <Form.Item
                                name="emailPro"
                                rules={[
                                    { required: true, message: 'Veuillez saisir l\'email professionnel!' },
                                    { type: 'email', message: 'Email invalide!' }
                                ]}
                            >
                                <Input prefix={<MailOutlined />} placeholder="Email professionnel" />
                            </Form.Item>
                        </>
                    )}

                    {/* Champs communs */}
                    <Form.Item
                        name="telephone"
                        rules={[{ required: true, message: 'Veuillez saisir votre numéro de téléphone!' }]}
                    >
                        <Input prefix={<PhoneOutlined />} placeholder="Téléphone" />
                    </Form.Item>

                    <Space style={{ width: '100%' }} size="middle">
                        <Form.Item
                            name="password"
                            style={{ width: '100%' }}
                            rules={[{ validator: validatePassword }]}
                        >
                            <Input.Password prefix={<LockOutlined />} placeholder="Mot de passe" />
                        </Form.Item>

                        <Form.Item
                            name="confirmPassword"
                            style={{ width: '100%' }}
                            dependencies={['password']}
                            rules={[
                                { required: true, message: 'Veuillez confirmer votre mot de passe!' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('password') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject('Les mots de passe ne correspondent pas!');
                                    },
                                }),
                            ]}
                        >
                            <Input.Password prefix={<LockOutlined />} placeholder="Confirmer le mot de passe" />
                        </Form.Item>
                    </Space>

                    <Form.Item
                        name="adresse"
                        rules={[{ required: true, message: 'Veuillez saisir votre adresse!' }]}
                    >
                        <Input prefix={<EnvironmentOutlined />} placeholder="Adresse" />
                    </Form.Item>

                    <Space style={{ width: '100%' }} size="middle">
                        {/* <Form.Item
                            name="codePostal"
                            style={{ width: '40%' }}
                            rules={[{ required: true, message: 'Code postal requis!' }]}
                        >
                            <Input placeholder="Code postal" />
                        </Form.Item> */}

                        <Form.Item
                            name="ville"
                            style={{ width: '60%' }}
                            rules={[{ required: true, message: 'Ville requise!' }]}
                        >
                            <Input placeholder="Ville" />
                        </Form.Item>
                    </Space>

                    <Form.Item
                        name="pays"
                        rules={[{ required: true, message: 'Veuillez sélectionner votre pays!' }]}
                    >
                        <Select placeholder="Sélectionnez votre pays">
                            <Option value="FR">France</Option>
                            <Option value="BE">Belgique</Option>
                            <Option value="CH">Suisse</Option>
                            <Option value="LU">Luxembourg</Option>
                        </Select>
                    </Form.Item>

                    <div className='flex items-center space-x-4'>
                        <Checkbox></Checkbox>
                        <div>Accept our condition</div>
                    </div>

                    <Form.Item className='mt-4'>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            block
                            style={{
                                height: '40px',
                                borderRadius: '6px',
                                background: '#1890ff'
                            }}
                        >
                            S'inscrire
                        </Button>
                    </Form.Item>

                    <Divider plain>
                        <Text type="secondary">OU</Text>
                    </Divider>

                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                        <div style={{ textAlign: 'center' }}>
                            <Text type="secondary">
                                Vous avez déjà un compte ? <Link onClick={() => { navigate("/login") }}>Se connecter</Link>
                            </Text>
                        </div>
                    </Space>
                </Form>
            </Card>
        </div>
    );
};

export default SignupPage;