// utils/auth.js

/**
 * Check if there is a logged-in ESN user
 * @returns {boolean} true if an ESN user is logged in, false otherwise
 */
export const isEsnLoggedIn = () => {
    try {
        const token = localStorage.getItem('token');
        const userType = localStorage.getItem('userType');
        const esnId = localStorage.getItem('id');

        return !!(token && userType === 'societe' && esnId);
    } catch (error) {
        return false;
    }
};

export const isClientLoggedIn = () => {
    try {
        const token = localStorage.getItem('token');
        const userType = localStorage.getItem('userType');
        const esnId = localStorage.getItem('id');

        return !!(token && userType === 'client' && esnId);
    } catch (error) {
        return false;
    }
};

export const isAdminLoggedIn = () => {
    try {
        const token = localStorage.getItem('adminToken');
        const esnId = localStorage.getItem('adminId');

        return !!(token && esnId);
    } catch (error) {
        return false;
    }
};

export const logoutEsn = () => {
    try {
        localStorage.removeItem('token');
        localStorage.removeItem('userType');
        localStorage.removeItem('id');
        localStorage.removeItem('esnName');
        localStorage.removeItem('siret');
        
        // You can add any additional cleanup here
        
        return true;
    } catch (error) {
        console.error('Logout error:', error);
        return false;
    }
};