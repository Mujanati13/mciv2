import React from 'react';
import { Result, Button } from 'antd';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      padding: '20px'
    }}>
      <Result
        status="404"
        title="404"
        subTitle="Désolé, la page que vous recherchez n'existe pas."
        extra={
          <Link to="/">
            <Button type="primary">Retour à l'accueil</Button>
          </Link>
        }
      />
    </div>
  );
};

export default NotFound;