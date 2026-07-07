import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import SpotTrade from "@/pages/SpotTrade";
import FuturesTrade from "@/pages/FuturesTrade";
import Markets from "@/pages/Markets";
import AssetsOverview from "@/pages/AssetsOverview";
import Deposit from "@/pages/Deposit";
import Withdraw from "@/pages/Withdraw";
import History from "@/pages/History";
import RiskCenter from "@/pages/RiskCenter";
import Login from "@/pages/Login";
import Register from "@/pages/Register";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/trade/:pair" element={<SpotTrade />} />
          <Route path="/futures/:pair" element={<FuturesTrade />} />
          <Route path="/markets" element={<Markets />} />
          <Route path="/risk" element={<RiskCenter />} />

          <Route path="/assets" element={<AssetsOverview />}>
            <Route index element={<Deposit />} />
            <Route path="deposit" element={<Deposit />} />
            <Route path="withdraw" element={<Withdraw />} />
            <Route path="history" element={<History />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}
