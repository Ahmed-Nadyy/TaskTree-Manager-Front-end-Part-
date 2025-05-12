import { notification } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faExclamationCircle, faInfoCircle, faUserPlus } from '@fortawesome/free-solid-svg-icons';

export const showNotification = (type, message, description, icon) => {
    notification[type]({
        message,
        description,
        icon,
        placement: 'topRight',
        duration: 4.5,
    });
};

export const showTaskAssignmentNotification = (assignedEmails) => {
    notification.success({
        message: 'Task Assigned Successfully',
        description: `Task has been assigned to ${assignedEmails.length} team member${assignedEmails.length > 1 ? 's' : ''}.`,
        icon: <FontAwesomeIcon icon={faUserPlus} className="text-blue-500" />,
        placement: 'topRight',
        duration: 4.5,
    });
};

export const showShareNotification = (success, message) => {
    if (success) {
        notification.success({
            message: 'Section Shared',
            description: message || 'Share link has been copied to clipboard.',
            icon: <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />,
            placement: 'topRight',
            duration: 4.5,
        });
    } else {
        notification.error({
            message: 'Share Failed',
            description: message || 'Failed to share section. Please try again.',
            icon: <FontAwesomeIcon icon={faExclamationCircle} className="text-red-500" />,
            placement: 'topRight',
            duration: 4.5,
        });
    }
};

export const notifySuccess = (message, description) => {
    showNotification('success', message, description, <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 dark:text-green-400" />);
};

export const notifyError = (message, description) => {
    showNotification('error', message, description, <FontAwesomeIcon icon={faExclamationCircle} className="text-red-500 dark:text-red-400" />);
};

export const notifyWarning = (message, description) => {
    showNotification('warning', message, description, <FontAwesomeIcon icon={faExclamationCircle} className="text-yellow-500 dark:text-yellow-400" />); // Using ExclamationCircle for warning too, or choose another like faExclamationTriangle
};

export const notifyInfo = (message, description) => {
    showNotification('info', message, description, <FontAwesomeIcon icon={faInfoCircle} className="text-blue-500 dark:text-blue-400" />);
};