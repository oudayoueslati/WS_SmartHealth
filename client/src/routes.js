
import Index from "views/Index.jsx";
import Profile from "views/examples/Profile.jsx";
import Register from "views/examples/Register.jsx";
import Login from "views/examples/Login.jsx";
import Tables from "views/examples/Tables.jsx";
import HealthPrograms from "views/HealthPrograms.jsx";
import Habitudes from "components/Habitude/HabitudeList.jsx";
import EvenementForm from "views/examples/Evenement.jsx"; 
import ArticleForm from "views/examples/Article.jsx"; 
import Aichatsaif from "components/Habitude//SaifAIChat.jsx"
import HabitudeLogs from "components/HabitudeLogs/HabitudeLogList";
import MesureForm from "views/examples/Mesure.jsx";
import ScoreSanteForm from "views/examples/ScoreSante.jsx";
import EtatSante from "views/examples/EtatSante";
import Objectif from "views/examples/Objectif";


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
    path: "/MesureForm",
    name: "Mesure",
    icon: "ni ni-planet text-blue",
    component: <MesureForm />,
    layout: "/admin",
  },
   {
    path: "/etat-sante",
    name: "État Santé",
    icon: "ni ni-favourite-28 text-red",
    component: <EtatSante />,
    layout: "/admin",
  },
   {
    path: "/objectif",
    name: "Objectif",
    icon: "ni ni-check-bold text-success",
    component: <Objectif />,
    layout: "/admin",
  },
  {
    path: "/ScoreSanteForm",
    name: "ScoreSante",
    icon: "ni ni-pin-3 text-orange",
    component: <ScoreSanteForm />,
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
