import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    Box,
    Typography,
    Button,
    Avatar,
    Divider,
    AppBar,
    Toolbar,
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    IconButton,
    ListItemButton,
} from '@mui/material';
import {
    Logout,
    Menu,
    Dashboard as DashboardIcon,
    ShoppingCart,
    Group,
    Event,
    Message,
    Settings,
    Person,
    Business,
    School,
} from '@mui/icons-material';
import { logoutUser } from '../../store/authSlice';
import { fetchConversations } from '../../store/chatSlice';
import type { RootState, AppDispatch } from '../../store';
import { useNavigate, useLocation } from 'react-router-dom';
import NotificationBadge from '../chat/NotificationBadge';

interface MainLayoutProps {
    children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);

    const [drawerOpen, setDrawerOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Загружаем чаты при монтировании компонента
    useEffect(() => {
        if (user?.role === 'admin') {
            dispatch(fetchConversations());
        }
    }, [dispatch, user?.role]);

    const handleLogout = () => {
        dispatch(logoutUser());
    };

    const handleChatClick = () => {
        navigate('/admin/chat');
    };



    const menuItems = [
        { id: 'dashboard', label: 'Главная', icon: <DashboardIcon />, path: '/admin' },
        { id: 'orders', label: 'Заказы', icon: <ShoppingCart />, path: '/admin/orders' },
        { id: 'services', label: 'Услуги', icon: <Business />, path: '/admin/services' },
        { id: 'schools', label: 'Школы', icon: <School />, path: '/admin/schools' },
        { id: 'workshops', label: 'Мастер-классы', icon: <Event />, path: '/admin/workshops' },
        { id: 'chat', label: 'Чат', icon: <Message />, path: '/admin/chat' },
        { id: 'users', label: 'Пользователи', icon: <Group />, path: '/admin/users' },
        { id: 'settings', label: 'Настройки', icon: <Settings />, path: '/admin/settings' },
    ];

    const handleMenuClick = (path: string) => {
        navigate(path);
        setDrawerOpen(false);
    };

    if (!user) return null;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <AppBar position="static">
                <Toolbar>
                    <IconButton
                        edge="start"
                        color="inherit"
                        onClick={() => setDrawerOpen(true)}
                        sx={{ mr: 2 }}
                    >
                        <Menu />
                    </IconButton>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Восковые ручки
                    </Typography>
                    <Box display="flex" alignItems="center" gap={2}>
                        {/* Иконка чата с индикатором непрочитанных сообщений */}
                        {user.role === 'admin' && (
                            <NotificationBadge onClick={handleChatClick} />
                        )}
                        <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                            <Person />
                        </Avatar>
                        <Typography variant="body2">
                            {user.firstName} {user.lastName}
                        </Typography>
                        <Button
                            color="inherit"
                            startIcon={<Logout />}
                            onClick={handleLogout}
                        >
                            Выйти
                        </Button>
                    </Box>
                </Toolbar>
            </AppBar>

            <Drawer
                anchor="left"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
            >
                <Box sx={{ width: 250 }} role="presentation">
                    <Box sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Меню
                        </Typography>
                    </Box>
                    <Divider />
                    <List>
                        {menuItems.map((item) => (
                            <ListItem key={item.id} disablePadding>
                                <ListItemButton
                                    selected={location.pathname === item.path}
                                    onClick={() => handleMenuClick(item.path)}
                                >
                                    <ListItemIcon>{item.icon}</ListItemIcon>
                                    <ListItemText primary={item.label} />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </Drawer>

            <Box component="main" sx={{ flexGrow: 1, backgroundColor: '#f5f5f5' }}>
                {children}
            </Box>
        </Box>
    );
};

export default MainLayout; 