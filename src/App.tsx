import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import MitarbeiterPage from '@/pages/MitarbeiterPage';
import ProduktionsbereichPage from '@/pages/ProduktionsbereichPage';
import AnlagenteiltypPage from '@/pages/AnlagenteiltypPage';
import AnlagePage from '@/pages/AnlagePage';
import AnlagenteilPage from '@/pages/AnlagenteilPage';
import BaugruppePage from '@/pages/BaugruppePage';
import StoerungsmeldungPage from '@/pages/StoerungsmeldungPage';
import KorrespondenzPage from '@/pages/KorrespondenzPage';
import NachrichtenPage from '@/pages/NachrichtenPage';
import DetailsPage from '@/pages/DetailsPage';

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="mitarbeiter" element={<MitarbeiterPage />} />
          <Route path="produktionsbereich" element={<ProduktionsbereichPage />} />
          <Route path="anlagenteiltyp" element={<AnlagenteiltypPage />} />
          <Route path="anlage" element={<AnlagePage />} />
          <Route path="anlagenteil" element={<AnlagenteilPage />} />
          <Route path="baugruppe" element={<BaugruppePage />} />
          <Route path="stoerungsmeldung" element={<StoerungsmeldungPage />} />
          <Route path="korrespondenz" element={<KorrespondenzPage />} />
          <Route path="nachrichten" element={<NachrichtenPage />} />
          <Route path="details" element={<DetailsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}