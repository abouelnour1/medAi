// iOS-style Settings screen.
import React from 'react';
import type { Language, TFunction } from '../types';
import {
  iOS,
  Icon,
  Row,
  List,
  LargeTitle,
  Tile,
  Switch,
  tileGradients,
  langPick,
  Dir,
} from './ui/ios';

interface Props {
  language: Language;
  t: TFunction;
  user: any;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onToggleLanguage: () => void;
  onLogin: () => void;
  onLogout: () => void;
  onOpenNotifications: () => void;
  onOpenStockTracker: () => void;
  onOpenOrderList: () => void;
  onOpenPrescription: () => void;
  onOpenPediatricCalc: () => void;
  onOpenDrugTest: () => void;
  onOpenAdmin?: () => void;
  appVersion?: string;
  favoritesCount?: number;
}

export default function IOSSettingsScreen(props: Props) {
  const { language, user, theme, onLogin, onLogout } = props;
  const dir: Dir = language === 'ar' ? 'rtl' : 'ltr';
  const tr = (ar: string, en: string) => langPick(language, ar, en);

  const initials = (user?.name || user?.email || '?')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div style={{ direction: dir, paddingBottom: 24 }}>
      <div style={{ paddingTop: 4 }}>
        <LargeTitle dir={dir} title={tr('الإعدادات', 'Settings')} />
      </div>

      {/* Profile card */}
      <List dir={dir}>
        {user ? (
          <Row
            tall
            dir={dir}
            leading={
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  background: `linear-gradient(135deg, ${tileGradients.blue.from}, ${tileGradients.blue.to})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 22,
                  fontWeight: 600,
                }}
              >
                {initials}
              </div>
            }
            title={user.name || user.email || tr('مستخدم', 'User')}
            subtitle={[user.specialty, user.role].filter(Boolean).join(' · ')}
            chevron
          />
        ) : (
          <Row
            dir={dir}
            leading={
              <Tile from={tileGradients.blue.from} to={tileGradients.blue.to} size={29}>
                <Icon.face color="#fff" size={16} />
              </Tile>
            }
            title={tr('تسجيل الدخول', 'Sign In')}
            subtitle={tr('احفظ المفضلة والمزامنة', 'Save favorites & sync')}
            chevron
            onClick={onLogin}
          />
        )}
      </List>

      {/* Account */}
      {user && (
        <List header={tr('الحساب', 'Account')} dir={dir}>
          <Row
            dir={dir}
            leading={
              <Tile from={tileGradients.red.from} to={tileGradients.red.to} size={29}>
                <Icon.bell color="#fff" size={16} />
              </Tile>
            }
            title={tr('الإشعارات', 'Notifications')}
            chevron
            onClick={props.onOpenNotifications}
          />
        </List>
      )}

      {/* Appearance */}
      <List header={tr('المظهر', 'Appearance')} dir={dir}>
        <Row
          dir={dir}
          leading={
            <Tile from={tileGradients.gray.from} to={tileGradients.gray.to} size={29}>
              <Icon.moon color="#fff" size={16} />
            </Tile>
          }
          title={tr('الوضع الداكن', 'Dark Mode')}
          trailing={<Switch on={theme === 'dark'} onChange={props.onToggleTheme} />}
        />
        <Row
          dir={dir}
          leading={
            <Tile from={tileGradients.teal.from} to={tileGradients.teal.to} size={29}>
              <Icon.lang color="#fff" size={16} />
            </Tile>
          }
          title={tr('اللغة', 'Language')}
          detail={language === 'ar' ? 'العربية' : 'English'}
          chevron
          onClick={props.onToggleLanguage}
        />
      </List>

      {/* Clinical tools */}
      <List header={tr('أدوات سريرية', 'Clinical tools')} dir={dir}>
        <Row
          dir={dir}
          leading={
            <Tile from={tileGradients.indigo.from} to={tileGradients.indigo.to} size={29}>
              <Icon.rx color="#fff" size={16} />
            </Tile>
          }
          title={tr('بناء الوصفات', 'Prescription Builder')}
          chevron
          onClick={props.onOpenPrescription}
        />
        <Row
          dir={dir}
          leading={
            <Tile from={tileGradients.red.from} to={tileGradients.red.to} size={29}>
              <Icon.baby color="#fff" size={16} />
            </Tile>
          }
          title={tr('حاسبة جرعات الأطفال', 'Pediatric Calculator')}
          chevron
          onClick={props.onOpenPediatricCalc}
        />
        <Row
          dir={dir}
          leading={
            <Tile from={tileGradients.purple.from} to={tileGradients.purple.to} size={29}>
              <Icon.flask color="#fff" size={16} />
            </Tile>
          }
          title={tr('فاحص تحليل الدواء', 'Drug Test Checker')}
          chevron
          onClick={props.onOpenDrugTest}
        />
      </List>

      {/* Inventory */}
      <List header={tr('المخزون والطلبات', 'Inventory & Orders')} dir={dir}>
        <Row
          dir={dir}
          leading={
            <Tile from={tileGradients.green.from} to={tileGradients.green.to} size={29}>
              <Icon.stock color="#fff" size={16} />
            </Tile>
          }
          title={tr('متابعة المخزون', 'Stock Tracker')}
          chevron
          onClick={props.onOpenStockTracker}
        />
        <Row
          dir={dir}
          leading={
            <Tile from={tileGradients.red.from} to={tileGradients.red.to} size={29}>
              <Icon.doc color="#fff" size={16} />
            </Tile>
          }
          title={tr('قائمة الطلبات', 'Order List')}
          chevron
          onClick={props.onOpenOrderList}
        />
      </List>

      {/* Admin */}
      {props.onOpenAdmin && user?.role === 'admin' && (
        <List header={tr('الإدارة', 'Admin')} dir={dir}>
          <Row
            dir={dir}
            leading={
              <Tile from={tileGradients.gray.from} to={tileGradients.gray.to} size={29}>
                <Icon.shield color="#fff" size={16} />
              </Tile>
            }
            title={tr('لوحة الإدارة', 'Admin Dashboard')}
            chevron
            onClick={props.onOpenAdmin}
          />
        </List>
      )}

      {/* About */}
      <List header={tr('عن التطبيق', 'About')} dir={dir}>
        <Row
          dir={dir}
          leading={
            <Tile from={tileGradients.orange.from} to={tileGradients.orange.to} size={29}>
              <Icon.info color="#fff" size={16} />
            </Tile>
          }
          title={tr('الإصدار', 'Version')}
          detail={props.appVersion || '1.0.0'}
        />
      </List>

      {/* Sign out */}
      {user && (
        <List dir={dir} footer={user.email ? `${tr('مسجّل دخول بـ', 'Signed in as')} ${user.email}` : undefined}>
          <Row dir={dir} title={tr('تسجيل الخروج', 'Sign Out')} destructive onClick={onLogout} />
        </List>
      )}
    </div>
  );
}
