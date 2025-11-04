/*!

=========================================================
* Argon Dashboard React - v1.2.4
=========================================================

* Product Page: https://www.creative-tim.com/product/argon-dashboard-react
* Copyright 2024 Creative Tim (https://www.creative-tim.com)
* Licensed under MIT (https://github.com/creativetimofficial/argon-dashboard-react/blob/master/LICENSE.md)

* Coded by Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/
import Index from "views/Index.jsx";
import Profile from "views/examples/Profile.jsx";
import Maps from "views/examples/Maps.jsx";
import Register from "views/examples/Register.jsx";
import Login from "views/examples/Login.jsx";
import Tables from "views/examples/Tables.jsx";
import Icons from "views/examples/Icons.jsx";
import HealthPrograms from "views/HealthPrograms.jsx";
import Services from "views/Services.jsx";
import Payments from "views/Payments.jsx";
import ServiceRecommendations from "views/ServiceRecommendations.jsx";
import MedicalAssistant from "views/MedicalAssistant.jsx";
import AdminDashboard from "views/AdminDashboard.jsx";
import AdminPayments from "views/AdminPayments.jsx";
import AdminServices from "views/AdminServices.jsx";
import Habitudes from "components/Habitude/HabitudeList.jsx";
import EvenementForm from "views/examples/Evenement.jsx"; 
import ArticleForm from "views/examples/Article.jsx"; 
import Aichatsaif from "components/Habitude//SaifAIChat.jsx"
import HabitudeLogs from "components/HabitudeLogs/HabitudeLogList";



var routes = [
  {
    path: "/index",
    name: "Dashboard",
    icon: "ni ni-tv-2 text-primary",
    component: <Index />,
    layout: "/admin",
  },
   {
    path: "/evenement",
    name: "Events",
    icon: "ni ni-pin-3 text-orange",
    component: <EvenementForm />,
    layout: "/admin",
  },
   {
    path: "/article",
    name: "Articles",
    icon: "ni ni-pin-3 text-orange",
    component: <ArticleForm />,
    layout: "/admin",
  },

  {
    path: "/habitudes",
    name: "Habitude",
    icon: "ni ni-planet text-blue",
    component: <Habitudes />,
    layout: "/admin",
  },
  {
    path: "/habitude-logs",
    name: "Habitude-Logs",
    icon: "ni ni-bullet-list-67 text-red",
    component: <HabitudeLogs />,
    layout: "/admin",
  },
  
    {
    path: "/aichat",
    name: "Aichatsaif",
    icon: "ni ni-pin-3 text-orange",
    component: <Aichatsaif />,
    layout: "/admin",
  },
  {
    path: "/health-programs",
    name: "Health Programs",
    icon: "ni ni-favourite-28 text-red",
    component: <HealthPrograms />,
    layout: "/admin",
  },
  {
    path: "/services",
    name: "Services",
    icon: "ni ni-briefcase-24 text-blue",
    component: <Services />,
    layout: "/admin",
  },
  {
    path: "/payments",
    name: "Paiements",
    icon: "ni ni-credit-card text-green",
    component: <Payments />,
    layout: "/admin",
  },
  {
    path: "/recommendations",
    name: "Recommandations IA",
    icon: "ni ni-bulb-61 text-yellow",
    component: <ServiceRecommendations />,
    layout: "/admin",
  },
  {
    path: "/assistant",
    name: "Assistant Médical",
    icon: "ni ni-chat-round text-info",
    component: <MedicalAssistant />,
    layout: "/admin",
  },
  {
    path: "/admin-dashboard",
    name: "Admin Dashboard",
    icon: "ni ni-chart-pie-35 text-purple",
    component: <AdminDashboard />,
    layout: "/admin",
  },
  {
    path: "/admin-payments",
    name: "Admin Paiements",
    icon: "ni ni-money-coins text-orange",
    component: <AdminPayments />,
    layout: "/admin",
  },
  {
    path: "/admin-services",
    name: "Admin Services",
    icon: "ni ni-settings-gear-65 text-cyan",
    component: <AdminServices />,
    layout: "/admin",
  },
  {
    path: "/icons",
    name: "Icons",
    icon: "ni ni-planet text-blue",
    component: <Icons />,
    layout: "/admin",
  },
  {
    path: "/maps",
    name: "Maps",
    icon: "ni ni-pin-3 text-orange",
    component: <Maps />,
    layout: "/admin",
  },
  {
    path: "/user-profile",
    name: "User Profile",
    icon: "ni ni-single-02 text-yellow",
    component: <Profile />,
    layout: "/admin",
  },
  {
    path: "/tables",
    name: "Tables",
    icon: "ni ni-bullet-list-67 text-red",
    component: <Tables />,
    layout: "/admin",
  },
  {
    path: "/login",
    name: "Login",
    icon: "ni ni-key-25 text-info",
    component: <Login />,
    layout: "/auth",
  },
  {
    path: "/register",
    name: "Register",
    icon: "ni ni-circle-08 text-pink",
    component: <Register />,
    layout: "/auth",
  },
];
export default routes;
