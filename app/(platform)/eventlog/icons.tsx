import {
    Phone, ShoppingCart, Wrench, ClipboardList, FlaskConical, Trash2,
    Sparkles, FileText, Monitor, Users, Briefcase, Calendar, Clock,
    AlertTriangle, CheckCircle, Mail, Bell, Map, Truck, Box, Key, Lock,
    Zap, Activity, Heart, Shield, Star, DollarSign, Percent, BarChart
} from 'lucide-react';

export const ICON_MAP: Record<string, any> = {
    'phone': Phone,
    'shopping-cart': ShoppingCart,
    'wrench': Wrench,
    'clipboard-list': ClipboardList,
    'flask-conical': FlaskConical,
    'trash-2': Trash2,
    'sparkles': Sparkles,
    'file-text': FileText,
    'monitor': Monitor,
    'users': Users,
    'briefcase': Briefcase,
    'calendar': Calendar,
    'clock': Clock,
    'alert-triangle': AlertTriangle,
    'check-circle': CheckCircle,
    'mail': Mail,
    'bell': Bell,
    'map': Map,
    'truck': Truck,
    'box': Box,
    'key': Key,
    'lock': Lock,
    'zap': Zap,
    'activity': Activity,
    'heart': Heart,
    'shield': Shield,
    'star': Star,
    'dollar-sign': DollarSign,
    'percent': Percent,
    'bar-chart': BarChart
};

export const getIcon = (name: string, props: any = {}) => {
    const Icon = ICON_MAP[name] || Calendar; // Default to Calendar
    return <Icon {...props} />;
};
