// IOS redesign preview — a self-contained preview of the new design system
// applied to EasyDrug. Not wired into real data; shows the target look.
import React, { useState } from 'react';
import type { Medicine } from '../types';
import {
  iOS,
  Icon,
  Tile,
  Row,
  List,
  Switch,
  Segmented,
  SearchField,
  NavBar,
  LargeTitle,
  Badge,
  StatBox,
  ActionBtn,
  QuickTile,
  BoxPlaceholder,
  IOSTabBar,
  tileGradients,
  TabKey,
} from './ui/ios';

// Sample placeholder data — uses real trade names so it looks familiar.
const sampleRecents = [
  { name: 'Panadol Extra', sci: 'Paracetamol 500mg + Caffeine 65mg', tint: iOS.blue },
  { name: 'Amoxil', sci: 'Amoxicillin 500mg · Capsule', tint: iOS.green },
  { name: 'Nexium', sci: 'Esomeprazole 40mg', tint: iOS.orange },
];

const sampleResults = [
  { name: 'Amoxil', sci: 'Amoxicillin 500mg', form: 'Capsule', mfr: 'GSK · UK', price: '22.50', tint: iOS.green },
  { name: 'Hiconcil', sci: 'Amoxicillin 500mg', form: 'Capsule', mfr: 'Krka · SI', price: '19.75', tint: iOS.green },
  { name: 'Augmentin', sci: 'Amoxicillin 875mg + Clavulanic 125mg', form: 'Tablet FC', mfr: 'GSK · UK', price: '54.00', tint: iOS.blue },
  { name: 'Moxyvit Forte', sci: 'Amoxicillin 1g', form: 'Tablet', mfr: 'Tabuk · SA', price: '48.30', tint: iOS.green },
  { name: 'Ospamox', sci: 'Amoxicillin 250mg/5ml', form: 'Suspension', mfr: 'Sandoz · AT', price: '16.00', tint: iOS.orange },
];

type Screen = 'home' | 'results' | 'detail' | 'insurance' | 'saved' | 'settings';

export default function IOSPreviewScreen({ onExit }: { onExit: () => void }) {
  const [tab, setTab] = useState<TabKey>('search');
  const [screen, setScreen] = useState<Screen>('home');
  const [query, setQuery] = useState('');
  const [segment, setSegment] = useState(0);

  const handleTabChange = (t: TabKey) => {
    setTab(t);
    if (t === 'search') setScreen('home');
    if (t === 'insurance') setScreen('insurance');
    if (t === 'saved') setScreen('saved');
    if (t === 'settings') setScreen('settings');
  };

  const content = (() => {
    if (tab === 'search' && screen === 'home') {
      return (
        <HomeScreen
          query={query}
          setQuery={(v) => {
            setQuery(v);
            if (v.length > 0) setScreen('results');
          }}
          segment={segment}
          setSegment={setSegment}
          onOpenResults={() => setScreen('results')}
        />
      );
    }
    if (tab === 'search' && screen === 'results') {
      return (
        <ResultsScreen
          query={query}
          setQuery={setQuery}
          segment={segment}
          setSegment={setSegment}
          onBack={() => {
            setQuery('');
            setScreen('home');
          }}
          onSelect={() => setScreen('detail')}
        />
      );
    }
    if (tab === 'search' && screen === 'detail') {
      return <DetailScreen onBack={() => setScreen('results')} />;
    }
    if (tab === 'insurance') return <InsuranceScreen />;
    if (tab === 'saved') return <SavedScreen />;
    if (tab === 'settings') return <SettingsScreen onExit={onExit} />;
    return null;
  })();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: iOS.bg,
        zIndex: 9999,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", system-ui, sans-serif',
        color: iOS.label,
        direction: 'ltr',
      }}
    >
      {/* Scrollable content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          paddingBottom: 83,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {content}
      </div>

      {/* Tab bar */}
      <IOSTabBar active={tab} onChange={handleTabChange} />
    </div>
  );
}

// ══════════════ Home ══════════════
function HomeScreen({
  query,
  setQuery,
  segment,
  setSegment,
  onOpenResults,
}: {
  query: string;
  setQuery: (v: string) => void;
  segment: number;
  setSegment: (i: number) => void;
  onOpenResults: () => void;
}) {
  return (
    <div style={{ minHeight: '100%' }}>
      <div style={{ paddingTop: 54 }}>
        <LargeTitle title="Easy Drug" subtitle="Saudi drug & insurance directory" />
        <div style={{ padding: '0 16px 12px' }}>
          <SearchField
            value={query}
            placeholder="Medicines, ingredients, indications"
            onChange={setQuery}
            onFocus={() => query.length > 0 && onOpenResults()}
          />
        </div>
        <div style={{ padding: '0 16px 12px' }}>
          <Segmented options={['Trade', 'Generic', 'All', 'Indication']} active={segment} onChange={setSegment} />
        </div>
      </div>

      {/* Quick tools */}
      <div style={{ padding: '4px 16px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <QuickTile
          from={tileGradients.blue.from}
          to={tileGradients.blue.to}
          icon={<Icon.rx color="#fff" size={22} />}
          title="Rx Builder"
          sub="Create a prescription"
        />
        <QuickTile
          from={tileGradients.pink.from}
          to={tileGradients.pink.to}
          icon={<Icon.baby color="#fff" size={22} />}
          title="Pediatric Dose"
          sub="Weight-based calc"
        />
        <QuickTile
          from={tileGradients.purple.from}
          to={tileGradients.purple.to}
          icon={<Icon.flask color="#fff" size={22} />}
          title="Drug Test"
          sub="Substance check"
        />
        <QuickTile
          from={tileGradients.teal.from}
          to={tileGradients.teal.to}
          icon={<Icon.sparkle color="#fff" size={22} />}
          title="AI Assistant"
          sub="Ask anything"
        />
      </div>

      <List header="Recent">
        {sampleRecents.map((m) => (
          <Row
            key={m.name}
            leading={<BoxPlaceholder size={38} tint={m.tint} />}
            title={m.name}
            subtitle={m.sci}
            chevron
          />
        ))}
      </List>

      <List header="Featured today">
        <Row
          leading={<BoxPlaceholder size={38} tint={iOS.indigo} />}
          title="Xarelto 20mg"
          subtitle="Anticoagulant · Daily tab"
          detail="SAR 182"
          chevron
        />
        <Row
          leading={<BoxPlaceholder size={38} tint={iOS.red} />}
          title="Crestor 10mg"
          subtitle="Rosuvastatin · Lipid lowering"
          detail="SAR 94"
          chevron
        />
      </List>
    </div>
  );
}

// ══════════════ Results ══════════════
function ResultsScreen({
  query,
  setQuery,
  segment,
  setSegment,
  onBack,
  onSelect,
}: {
  query: string;
  setQuery: (v: string) => void;
  segment: number;
  setSegment: (i: number) => void;
  onBack: () => void;
  onSelect: () => void;
}) {
  return (
    <div style={{ minHeight: '100%' }}>
      <NavBar
        leading={
          <button
            onClick={onBack}
            style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <Icon.chevronL color={iOS.blue} size={19} />
            <span style={{ fontSize: 17, color: iOS.blue, letterSpacing: -0.43 }}>Back</span>
          </button>
        }
        title=""
        trailing={<span style={{ fontSize: 17, color: iOS.blue, letterSpacing: -0.43 }}>Filter</span>}
      />
      <div
        style={{
          padding: '10px 16px 14px',
          background: 'rgba(249,249,249,0.92)',
          borderBottom: '0.5px solid rgba(60,60,67,0.18)',
        }}
      >
        <SearchField value={query || 'amoxi'} onChange={setQuery} placeholder="Search" />
        <div style={{ marginTop: 10 }}>
          <Segmented
            options={['Trade', 'Generic', 'All', 'Indication']}
            active={segment || 1}
            onChange={setSegment}
          />
        </div>
      </div>

      <div
        style={{
          padding: '14px 32px 6px',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontSize: 13,
            color: iOS.label2,
            textTransform: 'uppercase',
            letterSpacing: -0.08,
          }}
        >
          {sampleResults.length} Results
        </span>
        <span style={{ fontSize: 13, color: iOS.blue }}>Sort: Relevance</span>
      </div>

      <div style={{ margin: '0 16px 24px', background: iOS.bg2, borderRadius: 10, overflow: 'hidden' }}>
        {sampleResults.map((r, i) => (
          <MedRow key={r.name} {...r} last={i === sampleResults.length - 1} onClick={onSelect} />
        ))}
      </div>
    </div>
  );
}

function MedRow({
  name,
  sci,
  form,
  mfr,
  price,
  tint,
  last,
  onClick,
}: {
  name: string;
  sci: string;
  form: string;
  mfr: string;
  price: string;
  tint: string;
  last?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        position: 'relative',
        background: iOS.bg2,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <BoxPlaceholder size={52} tint={tint} />
      <div style={{ flex: 1, marginLeft: 12, minWidth: 0 }}>
        <div
          style={{
            fontSize: 17,
            fontWeight: 600,
            color: iOS.label,
            letterSpacing: -0.43,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {name}
        </div>
        <div style={{ fontSize: 13, color: iOS.label2, letterSpacing: -0.08, marginTop: 1 }}>{sci}</div>
        <div
          style={{
            fontSize: 12,
            color: iOS.label3,
            marginTop: 2,
            display: 'flex',
            gap: 8,
            alignItems: 'center',
          }}
        >
          <span>{form}</span>
          <span style={{ width: 2, height: 2, borderRadius: '50%', background: iOS.label3 }} />
          <span>{mfr}</span>
        </div>
      </div>
      <div style={{ textAlign: 'right', marginLeft: 8, flexShrink: 0 }}>
        <div style={{ fontSize: 17, fontWeight: 600, color: iOS.label, letterSpacing: -0.43 }}>{price}</div>
        <div style={{ fontSize: 11, color: iOS.label2, marginTop: 1 }}>SAR</div>
      </div>
      <div style={{ marginLeft: 8 }}>
        <Icon.chevronR />
      </div>
      {!last && (
        <div
          style={{
            position: 'absolute',
            left: 80,
            right: 0,
            bottom: 0,
            height: 0.5,
            background: iOS.sepCell,
          }}
        />
      )}
    </div>
  );
}

// ══════════════ Detail ══════════════
function DetailScreen({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ minHeight: '100%', paddingBottom: 40 }}>
      <NavBar
        leading={
          <button
            onClick={onBack}
            style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <Icon.chevronL color={iOS.blue} size={19} />
            <span style={{ fontSize: 17, color: iOS.blue, letterSpacing: -0.43 }}>Results</span>
          </button>
        }
        title="Amoxil"
        trailing={<Icon.ellipsis color={iOS.blue} size={18} />}
      />

      {/* Hero */}
      <div style={{ padding: '14px 16px 6px' }}>
        <div
          style={{
            background: iOS.bg2,
            borderRadius: 14,
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            boxShadow: '0 0.5px 0 rgba(0,0,0,0.04)',
          }}
        >
          <BoxPlaceholder size={76} tint={iOS.green} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 0.35, lineHeight: 1.1 }}>Amoxil</div>
            <div style={{ fontSize: 15, color: iOS.label2, marginTop: 4, letterSpacing: -0.23 }}>
              Amoxicillin 500 mg
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <Badge color={iOS.green}>Rx</Badge>
              <Badge color={iOS.blue}>Capsule</Badge>
              <Badge color={iOS.gray}>21 caps</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ padding: '12px 16px 8px', display: 'flex', gap: 10 }}>
        <StatBox label="Price" value="SAR 22.50" big />
        <StatBox label="Per dose" value="1.07" />
        <StatBox label="ATC" value="J01CA04" />
      </div>

      {/* Actions */}
      <div style={{ padding: '4px 16px 8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <ActionBtn tint={iOS.blue} filled icon={<Icon.pill color="#fff" size={16} />} label="Find Alternatives" />
        <ActionBtn tint={iOS.blue} icon={<Icon.share color={iOS.blue} size={16} />} label="Share" />
      </div>

      <List header="Composition">
        <Row title="Active ingredient" detail="Amoxicillin" />
        <Row title="Strength" detail="500 mg" />
        <Row title="Pharmaceutical form" detail="Capsule" />
        <Row title="Administration route" detail="Oral" />
      </List>

      <List header="Regulatory">
        <Row title="Legal status" detail="Prescription" />
        <Row title="Registration no." detail="5-23-8811" />
        <Row title="ATC code" detail="J01CA04" chevron />
        <Row title="Last update" detail="Mar 2026" />
      </List>

      <List header="Manufacturer & Agent">
        <Row
          leading={
            <Tile from={tileGradients.orange.from} to={tileGradients.orange.to} size={29}>
              <Icon.flag color="#fff" size={16} />
            </Tile>
          }
          title="GSK Pharmaceuticals"
          subtitle="United Kingdom"
          chevron
        />
        <Row
          leading={
            <Tile from={tileGradients.green.from} to={tileGradients.green.to} size={29}>
              <Icon.shield color="#fff" size={16} />
            </Tile>
          }
          title="Saudi Arabian Marketing"
          subtitle="Local agent · Riyadh"
          chevron
        />
      </List>

      <List header="Safety">
        <Row
          leading={
            <Tile from={tileGradients.red.from} to={tileGradients.red.to} size={29}>
              <Icon.flag color="#fff" size={16} />
            </Tile>
          }
          title="Drug interactions"
          detail="3"
          chevron
        />
        <Row
          leading={
            <Tile from={tileGradients.yellow.from} to={tileGradients.yellow.to} size={29}>
              <Icon.info color="#fff" size={16} />
            </Tile>
          }
          title="Clinical reference"
          chevron
        />
        <Row
          leading={
            <Tile from={tileGradients.blue.from} to={tileGradients.blue.to} size={29}>
              <Icon.baby color="#fff" size={16} />
            </Tile>
          }
          title="Pediatric dosing"
          chevron
        />
      </List>
    </div>
  );
}

// ══════════════ Insurance ══════════════
function InsuranceScreen() {
  return (
    <div style={{ minHeight: '100%' }}>
      <div style={{ paddingTop: 54 }}>
        <LargeTitle title="Insurance" subtitle="CHI formulary lookup" />
        <div style={{ padding: '0 16px 12px' }}>
          <SearchField placeholder="Scientific name, trade, or ICD-10" />
        </div>
        <div style={{ padding: '0 16px 16px' }}>
          <Segmented options={['Generic', 'Trade', 'Indication', 'ICD-10']} active={2} />
        </div>
      </div>

      <List header="Therapeutic classes">
        <Row
          leading={
            <Tile from={tileGradients.red.from} to={tileGradients.red.to} size={29}>
              <Icon.shield color="#fff" size={16} />
            </Tile>
          }
          title="Cardiovascular"
          subtitle="126 approved drugs"
          chevron
        />
        <Row
          leading={
            <Tile from={tileGradients.teal.from} to={tileGradients.teal.to} size={29}>
              <Icon.flask color="#fff" size={16} />
            </Tile>
          }
          title="Antimicrobials"
          subtitle="84 approved drugs"
          chevron
        />
        <Row
          leading={
            <Tile from={tileGradients.orange.from} to={tileGradients.orange.to} size={29}>
              <Icon.pill color="#fff" size={16} />
            </Tile>
          }
          title="Diabetes & endocrine"
          subtitle="62 approved drugs"
          chevron
        />
        <Row
          leading={
            <Tile from={tileGradients.purple.from} to={tileGradients.purple.to} size={29}>
              <Icon.baby color="#fff" size={16} />
            </Tile>
          }
          title="Pediatric care"
          subtitle="48 approved drugs"
          chevron
        />
        <Row
          leading={
            <Tile from={tileGradients.blue.from} to={tileGradients.blue.to} size={29}>
              <Icon.info color="#fff" size={16} />
            </Tile>
          }
          title="Respiratory"
          subtitle="39 approved drugs"
          chevron
        />
      </List>

      <List header="Recently viewed">
        <Row
          leading={
            <Tile from={tileGradients.green.from} to={tileGradients.green.to} size={29}>
              <Icon.pill color="#fff" size={16} />
            </Tile>
          }
          title="Metformin HCl"
          subtitle="A10BA02 · Covered · MDD 3g"
          chevron
        />
        <Row
          leading={
            <Tile from={tileGradients.green.from} to={tileGradients.green.to} size={29}>
              <Icon.pill color="#fff" size={16} />
            </Tile>
          }
          title="Atorvastatin"
          subtitle="C10AA05 · Covered · MDD 80mg"
          chevron
        />
      </List>
    </div>
  );
}

// ══════════════ Saved ══════════════
function SavedScreen() {
  return (
    <div style={{ minHeight: '100%' }}>
      <div style={{ paddingTop: 54 }}>
        <LargeTitle
          title="Saved"
          subtitle="12 medicines · 3 lists"
          trailing={<div style={{ padding: '0 4px', fontSize: 17, color: iOS.blue }}>Edit</div>}
        />
        <div style={{ padding: '0 16px 14px' }}>
          <SearchField placeholder="Search saved" />
        </div>
      </div>

      <List header="Lists">
        <Row
          leading={
            <Tile from={tileGradients.orange.from} to={tileGradients.orange.to} size={29}>
              <Icon.star color="#fff" filled size={16} />
            </Tile>
          }
          title="Favorites"
          detail="8"
          chevron
        />
        <Row
          leading={
            <Tile from={tileGradients.red.from} to={tileGradients.red.to} size={29}>
              <Icon.heart color="#fff" filled size={16} />
            </Tile>
          }
          title="Patient — Ahmed"
          detail="3"
          chevron
        />
        <Row
          leading={
            <Tile from={tileGradients.blue.from} to={tileGradients.blue.to} size={29}>
              <Icon.pill color="#fff" size={16} />
            </Tile>
          }
          title="Ward stock"
          detail="1"
          chevron
        />
      </List>

      <div
        style={{
          padding: '8px 32px 6px',
          fontSize: 13,
          color: iOS.label2,
          textTransform: 'uppercase',
          letterSpacing: -0.08,
        }}
      >
        All saved
      </div>
      <div
        style={{
          margin: '0 16px 24px',
          borderRadius: 10,
          background: iOS.bg2,
          overflow: 'hidden',
        }}
      >
        <MedRow name="Panadol Extra" sci="Paracetamol 500 + Caffeine 65" form="Tablet" mfr="GSK · UK" price="12.50" tint={iOS.blue} />
        <MedRow name="Amoxil" sci="Amoxicillin 500mg" form="Capsule" mfr="GSK · UK" price="22.50" tint={iOS.green} />
        <MedRow name="Nexium 40" sci="Esomeprazole 40mg" form="Tablet DR" mfr="AstraZeneca" price="88.00" tint={iOS.orange} />
        <MedRow name="Crestor 10" sci="Rosuvastatin 10mg" form="Tablet FC" mfr="AstraZeneca" price="94.00" tint={iOS.red} last />
      </div>
    </div>
  );
}

// ══════════════ Settings ══════════════
function SettingsScreen({ onExit }: { onExit: () => void }) {
  const [faceId, setFaceId] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div style={{ minHeight: '100%' }}>
      <div style={{ paddingTop: 54 }}>
        <LargeTitle title="Settings" />
      </div>

      <List>
        <Row
          tall
          leading={
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                background: 'linear-gradient(135deg, #6DA8FF, #007AFF)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 22,
                fontWeight: 600,
              }}
            >
              HA
            </div>
          }
          title="Dr. Hassan Al-Qahtani"
          subtitle="Pharmacist · Riyadh · Premium"
          chevron
        />
      </List>

      <List header="Account">
        <Row
          leading={
            <Tile from={tileGradients.red.from} to={tileGradients.red.to} size={29}>
              <Icon.bell color="#fff" size={16} />
            </Tile>
          }
          title="Notifications"
          detail="On"
          chevron
        />
        <Row
          leading={
            <Tile from={tileGradients.purple.from} to={tileGradients.purple.to} size={29}>
              <Icon.face color="#fff" size={16} />
            </Tile>
          }
          title="Face ID"
          trailing={<Switch on={faceId} onChange={setFaceId} />}
        />
        <Row
          leading={
            <Tile from={tileGradients.blue.from} to={tileGradients.blue.to} size={29}>
              <Icon.shield color="#fff" size={16} />
            </Tile>
          }
          title="Privacy & Data"
          chevron
        />
      </List>

      <List header="Appearance">
        <Row
          leading={
            <Tile from={tileGradients.gray.from} to={tileGradients.gray.to} size={29}>
              <Icon.moon color="#fff" size={16} />
            </Tile>
          }
          title="Dark Mode"
          trailing={<Switch on={darkMode} onChange={setDarkMode} />}
        />
        <Row
          leading={
            <Tile from={tileGradients.teal.from} to={tileGradients.teal.to} size={29}>
              <Icon.lang color="#fff" size={16} />
            </Tile>
          }
          title="Language"
          detail="English"
          chevron
        />
        <Row
          leading={
            <Tile from={tileGradients.orange.from} to={tileGradients.orange.to} size={29}>
              <Icon.sparkle color="#fff" size={16} />
            </Tile>
          }
          title="Text Size"
          detail="Default"
          chevron
        />
      </List>

      <List header="Clinical tools">
        <Row
          leading={
            <Tile from={tileGradients.green.from} to={tileGradients.green.to} size={29}>
              <Icon.rx color="#fff" size={16} />
            </Tile>
          }
          title="Prescription Builder"
          chevron
        />
        <Row
          leading={
            <Tile from={tileGradients.red.from} to={tileGradients.red.to} size={29}>
              <Icon.baby color="#fff" size={16} />
            </Tile>
          }
          title="Pediatric Calculator"
          chevron
        />
        <Row
          leading={
            <Tile from={tileGradients.purple.from} to={tileGradients.purple.to} size={29}>
              <Icon.flask color="#fff" size={16} />
            </Tile>
          }
          title="Drug Test Checker"
          chevron
        />
        <Row
          leading={
            <Tile from={tileGradients.teal.from} to={tileGradients.teal.to} size={29}>
              <Icon.sparkle color="#fff" size={16} />
            </Tile>
          }
          title="AI Assistant Access"
          detail="Granted"
          chevron
        />
      </List>

      <List header="Data">
        <Row
          leading={
            <Tile from={tileGradients.gray.from} to={tileGradients.gray.to} size={29}>
              <Icon.globe color="#fff" size={16} />
            </Tile>
          }
          title="Sync Medicines"
          detail="Mar 18 · 8,431 items"
          chevron
        />
        <Row
          leading={
            <Tile from={tileGradients.green.from} to={tileGradients.green.to} size={29}>
              <Icon.shield color="#fff" size={16} />
            </Tile>
          }
          title="Offline cache"
          detail="128 MB"
          chevron
        />
        <Row
          leading={
            <Tile from={tileGradients.orange.from} to={tileGradients.orange.to} size={29}>
              <Icon.info color="#fff" size={16} />
            </Tile>
          }
          title="About"
          detail="v4.12.0"
          chevron
        />
      </List>

      <List footer="This is a preview of the new iOS-style design. Tap below to return to the current app.">
        <Row title="Exit Preview" destructive onClick={onExit} />
      </List>
    </div>
  );
}
