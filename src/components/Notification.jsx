import { notification } from 'antd';

const showNotification = (type, message, description = '') => {
    notification[type]({
        message,
        description,
        className: 'dark:bg-gray-800 dark:text-gray-200',
        style: {
            borderRadius: '8px',
        },
    });
};

export const notifySuccess = (message, description) => {
    showNotification('success', message, description);
};

export const notifyError = (message, description) => {
    showNotification('error', message, description);
};

export const notifyWarning = (message, description) => {
    showNotification('warning', message, description);
};

export const notifyInfo = (message, description) => {
    showNotification('info', message, description);
};