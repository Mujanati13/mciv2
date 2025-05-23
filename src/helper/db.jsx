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

export const isConsultantLoggedIn = () => {
    try {
        const token = localStorage.getItem('consultantToken');
        return !!token;
    } catch (error) {
        return false;
    }
};

export const isCommercialLoggedIn = () => {
    try {
        const token = localStorage.getItem('unifiedToken');
        const userRole = localStorage.getItem('userRole');
        return !!(token && userRole === 'commercial');
    } catch (error) {
        return false;
    }
};

export const isUnifiedUserLoggedIn = () => {
    try {
        const token = localStorage.getItem('unifiedToken');
        const userId = localStorage.getItem('userId');
        const userRole = localStorage.getItem('userRole');
        return !!(token && userId && userRole);
    } catch (error) {
        return false;
    }
};

export const isUnifiedConsultantLoggedIn = () => {
    try {
        const unifiedToken = localStorage.getItem('unifiedToken');
        const userId = localStorage.getItem('userId');
        const userRole = localStorage.getItem('userRole');
        
        return !!(unifiedToken && userId && userRole === 'consultant');
    } catch (error) {
        return false;
    }
};

export const getAuthToken = () => {
    // Return the appropriate token based on which login method was used
    const consultantToken = localStorage.getItem('consultantToken');
    const unifiedToken = localStorage.getItem('unifiedToken');
    
    return unifiedToken || consultantToken;
};

export const getUserId = () => {
    // Return the appropriate user ID based on which login method was used
    const consultantId = localStorage.getItem('consultantId');
    const userId = localStorage.getItem('userId');
    
    return userId || consultantId;
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

export const logoutConsultant = (navigate) => {
    const consultantToken = localStorage.getItem("consultantToken");
    const unifiedToken = localStorage.getItem("unifiedToken");
    
    if (consultantToken) {
        // Legacy logout
        localStorage.removeItem("consultantToken");
        localStorage.removeItem("consultantId");
    }
    
    if (unifiedToken) {
        // Unified login logout
        localStorage.removeItem("unifiedToken");
        localStorage.removeItem("userId");
        localStorage.removeItem("userRole");
        localStorage.removeItem("esnId");
        localStorage.removeItem("userName");
        localStorage.removeItem("userType");
    }
    
    // Redirect to appropriate login page
    if (navigate) {
        if (unifiedToken) {
            navigate("/unified-login");
        } else {
            navigate("/loginConsultant");
        }
    }
};