import React, { useEffect, useState } from "react";
import { getAllHabitudes, deleteHabitude } from "../../api/habitudeApi";
import HabitudeForm from "./HabitudeForm";
import { useAuth } from "../../context/AuthContext";

// Composants Argon
import Header from "components/Headers/Header.js";
import Sidebar from "components/Sidebar/Sidebar.js";
import Index from "views/Index.jsx";
import Profile from "views/examples/Profile.jsx";
import Maps from "views/examples/Maps.jsx";
import Register from "views/examples/Register.jsx";
import Login from "views/examples/Login.jsx";
import Tables from "views/examples/Tables.jsx";
import Icons from "views/examples/Icons.jsx";
import HealthPrograms from "views/HealthPrograms.jsx";
import Habitudes from "components/Habitude/HabitudeList.jsx";


// reactstrap components
import {
Container,
Row,
Col,
Card,
CardHeader,
CardBody,
Button,
Badge,
Alert,
Nav,
NavItem,
NavLink,
TabContent,
TabPane,
Progress
} from "reactstrap";
import classnames from 'classnames';
// Routes locales pour éviter l'import circulaire
const localRoutes = [
    {
    path: "/index",
    name: "Dashboard",
    icon: "ni ni-tv-2 text-primary",
    layout: "/admin",
    },
    {
    path: "/evenement",
    name: "Events",
    icon: "ni ni-pin-3 text-orange",
    layout: "/admin",
    },
    {
    path: "/article",
    name: "Articles",
    icon: "ni ni-pin-3 text-orange",
    layout: "/admin",
    },
    {
    path: "/habitudes",
    name: "Habitudes",
    icon: "ni ni-time-alarm text-orange",
    layout: "/admin",
    },
    {
    path: "/health-programs",
    name: "Health Programs",
    icon: "ni ni-favourite-28 text-red",
    layout: "/admin",
    },
    {
    path: "/icons",
    name: "Icons",
    icon: "ni ni-planet text-blue",
    layout: "/admin",
    },
    {
    path: "/maps",
    name: "Maps",
    icon: "ni ni-pin-3 text-orange",
    layout: "/admin",
    },
    {
    path: "/user-profile",
    name: "User Profile",
    icon: "ni ni-single-02 text-yellow",
    layout: "/admin",
    },
    {
    path: "/tables",
    name: "Tables",
    icon: "ni ni-bullet-list-67 text-red",
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
const HabitudeList = () => {
const [habitudes, setHabitudes] = useState([]);
const [selected, setSelected] = useState(null);
const [selectedHabitude, setSelectedHabitude] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");
const [activeTab, setActiveTab] = useState('1');
const { user, logout, loading: authLoading } = useAuth();

// ✅ FONCTION: CHARGER_HABITUDES
const chargerHabitudes = async () => {
    try {
    setLoading(true);
    setError("");
    
    const res = await getAllHabitudes();
    
    if (!res.data) {
        setHabitudes([]);
        return;
    }

    const habitudesFormatees = formaterDonneesHabitudes(res.data);
    setHabitudes(habitudesFormatees);
    } catch (err) {
    console.error("❌ CHARGER_HABITUDES - Erreur:", err);
    setError("Impossible de charger les habitudes.");
    } finally {
    setLoading(false);
    }
};

// ✅ FONCTION: FORMATER_DONNEES_HABITUDES
const formaterDonneesHabitudes = (donneesRDF) => {
    if (!Array.isArray(donneesRDF)) return [];

    return donneesRDF.map((habitude, index) => {
    const idComplet = habitude.habit?.value || "";
    const idSimple = idComplet.includes('#') ? idComplet.split('#')[1] : idComplet;
    
    const typeComplet = habitude.type?.value || "";
    const typeSimple = typeComplet.includes('#') ? typeComplet.split('#')[1] : typeComplet;

    return {
        id: idComplet,
        idSimple: idSimple,
        type: typeSimple,
        title: habitude.title?.value || "",
        description: habitude.desc?.value || "",
        calories: habitude.calories?.value || "",
        hours: habitude.hours?.value || "",
        steps: habitude.steps?.value || "",
        rawData: habitude
    };
    }).filter(h => h.title);
};

// ✅ FONCTION: SUPPRIMER_HABITUDE
const supprimerHabitude = async (habitudeId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette habitude ?")) return;

    try {
    await deleteHabitude(habitudeId);
    chargerHabitudes();
    setSelectedHabitude(null);
    } catch (err) {
    console.error("❌ SUPPRIMER_HABITUDE - Erreur:", err);
    alert("Erreur lors de la suppression.");
    }
};

// ✅ FONCTION: OBTENIR_COULEUR_TYPE
const obtenirCouleurType = (type) => {
    const couleurs = {
    'Sommeil': 'primary',
    'Nutrition': 'success', 
    'ActivitéPhysique': 'danger',
    'Stress': 'warning'
    };
    return couleurs[type] || 'secondary';
};

// ✅ FONCTION: OBTENIR_ICONE_TYPE
const obtenirIconeType = (type) => {
    const icones = {
    'Sommeil': 'fas fa-bed',
    'Nutrition': 'fas fa-utensils', 
    'ActivitéPhysique': 'fas fa-walking',
    'Stress': 'fas fa-brain'
    };
    return icones[type] || 'fas fa-chart-bar';
};

// ✅ FONCTION: CALCULER_STATISTIQUES
const calculerStatistiques = () => {
    const stats = {
    total: habitudes.length,
    sommeil: habitudes.filter(h => h.type === 'Sommeil').length,
    nutrition: habitudes.filter(h => h.type === 'Nutrition').length,
    activite: habitudes.filter(h => h.type === 'ActivitéPhysique').length,
    stress: habitudes.filter(h => h.type === 'Stress').length,
    moyenneCalories: 0,
    moyenneSommeil: 0,
    totalPas: 0
    };

    // Calcul des moyennes
    const habitudesNutrition = habitudes.filter(h => h.type === 'Nutrition' && h.calories);
    if (habitudesNutrition.length > 0) {
    stats.moyenneCalories = habitudesNutrition.reduce((sum, h) => sum + parseInt(h.calories), 0) / habitudesNutrition.length;
    }

    const habitudesSommeil = habitudes.filter(h => h.type === 'Sommeil' && h.hours);
    if (habitudesSommeil.length > 0) {
    stats.moyenneSommeil = habitudesSommeil.reduce((sum, h) => sum + parseFloat(h.hours), 0) / habitudesSommeil.length;
    }

    const habitudesActivite = habitudes.filter(h => h.type === 'ActivitéPhysique' && h.steps);
    if (habitudesActivite.length > 0) {
    stats.totalPas = habitudesActivite.reduce((sum, h) => sum + parseInt(h.steps), 0);
    }

    return stats;
};

const stats = calculerStatistiques();

useEffect(() => {
    if (user) {
    chargerHabitudes();
    }
}, [user]);

const toggleTab = (tab) => {
    if (activeTab !== tab) setActiveTab(tab);
};

if (authLoading) {
    return (
    <>
        <Sidebar
        routes={localRoutes}
        logo={{
            innerLink: "/admin/index",
            imgSrc: require("../../assets/img/brand/argon-react.png"),
            imgAlt: "..."
        }}
        />
        <div className="main-content">
        <Header />
        <Container className="mt--7" fluid>
            <Row>
            <Col className="mb-5 mb-xl-0" xl="12">
                <Card className="bg-gradient-default shadow">
                <CardBody>
                    <div className="text-center">
                    <div className="spinner-border text-light" role="status">
                        <span className="sr-only">Chargement...</span>
                    </div>
                    <p className="text-light mt-2">Chargement...</p>
                    </div>
                </CardBody>
                </Card>
            </Col>
            </Row>
        </Container>
        </div>
    </>
    );
}

if (!user) {
    return (
    <>
        <Sidebar
        routes={localRoutes}
        logo={{
            innerLink: "/admin/index",
            imgSrc: require("../../assets/img/brand/argon-react.png"),
            imgAlt: "..."
        }}
        />
        <div className="main-content">
        <Header />
        <Container className="mt--7" fluid>
            <Row>
            <Col className="mb-5 mb-xl-0" xl="12">
                <Card className="shadow">
                <CardBody className="text-center py-5">
                    <h3 className="text-danger">🔐 Connexion Requise</h3>
                    <p className="text-muted">Veuillez vous connecter pour gérer vos habitudes.</p>
                    <Button color="primary" onClick={() => window.location.href = '/auth/login'}>
                    Se connecter
                    </Button>
                </CardBody>
                </Card>
            </Col>
            </Row>
        </Container>
        </div>
    </>
    );
}

return (
    <>
    {/* SIDEBAR ARGON */}
    <Sidebar
        routes={localRoutes}
        logo={{
        innerLink: "/admin/index",
        imgSrc: require("../../assets/img/brand/argon-react.png"),
        imgAlt: "..."
        }}
    />
    
    {/* CONTENU PRINCIPAL */}
    <div className="main-content">
        {/* HEADER ARGON */}
        <Header />
        
        <Container className="mt--7" fluid>
        {/* En-tête de page */}
        <Row className="mb-5">
            <Col>
            <div className="d-flex justify-content-between align-items-center">
                <div>
                <h1 className="display-2 text-white">Gestion des Habitudes</h1>
                <p className="text-white mb-0">
                    Gérez et suivez vos habitudes de santé quotidiennes
                </p>
                </div>
                <Button color="primary" onClick={chargerHabitudes} disabled={loading}>
                <i className="fas fa-sync-alt mr-2"></i>
                {loading ? 'Chargement...' : 'Actualiser'}
                </Button>
            </div>
            </Col>
        </Row>

        {/* Navigation par onglets */}
        <Row className="mb-5">
            <Col>
            <Card className="shadow">
                <CardHeader className="border-0">
                <Nav className="nav-fill flex-column flex-md-row" pills role="tablist">
                    <NavItem>
                    <NavLink
                        className={classnames("mb-sm-3 mb-md-0", {
                        active: activeTab === '1',
                        })}
                        onClick={() => toggleTab('1')}
                        role="button"
                    >
                        <i className="ni ni-chart-pie-35 mr-2"></i>
                        Tableau de Bord
                    </NavLink>
                    </NavItem>
                    <NavItem>
                    <NavLink
                        className={classnames("mb-sm-3 mb-md-0", {
                        active: activeTab === '2',
                        })}
                        onClick={() => toggleTab('2')}
                        role="button"
                    >
                        <i className="ni ni-bullet-list-67 mr-2"></i>
                        Toutes les Habitudes
                    </NavLink>
                    </NavItem>
                </Nav>
                </CardHeader>
            </Card>
            </Col>
        </Row>

        <TabContent activeTab={activeTab}>
            {/* TAB 1: TABLEAU DE BORD */}
            <TabPane tabId="1">
            {/* Cartes de Statistiques */}
            <Row className="mb-5">
                <Col lg="3" md="6" className="mb-4">
                <Card className="card-stats shadow">
                    <CardBody>
                    <Row>
                        <div className="col">
                        <h5 className="card-title text-uppercase text-muted mb-0">
                            Total Habitudes
                        </h5>
                        <span className="h2 font-weight-bold mb-0">{stats.total}</span>
                        </div>
                        <Col className="col-auto">
                        <div className="icon icon-shape bg-gradient-red text-white rounded-circle shadow">
                            <i className="fas fa-chart-bar" />
                        </div>
                        </Col>
                    </Row>
                    <p className="mt-3 mb-0 text-muted text-sm">
                        <span className="text-success mr-2">
                        <i className="fa fa-arrow-up" /> 12%
                        </span>
                        <span className="text-nowrap">Depuis hier</span>
                    </p>
                    </CardBody>
                </Card>
                </Col>

                <Col lg="3" md="6" className="mb-4">
                <Card className="card-stats shadow">
                    <CardBody>
                    <Row>
                        <div className="col">
                        <h5 className="card-title text-uppercase text-muted mb-0">
                            Sommeil Moyen
                        </h5>
                        <span className="h2 font-weight-bold mb-0">
                            {stats.moyenneSommeil > 0 ? stats.moyenneSommeil.toFixed(1) + 'h' : 'N/A'}
                        </span>
                        </div>
                        <Col className="col-auto">
                        <div className="icon icon-shape bg-gradient-info text-white rounded-circle shadow">
                            <i className="fas fa-bed" />
                        </div>
                        </Col>
                    </Row>
                    <Progress
                        className="my-2"
                        value={(stats.moyenneSommeil / 8) * 100}
                        color="info"
                    />
                    <p className="mt-3 mb-0 text-muted text-sm">
                        <span className="text-nowrap">Objectif: 8h</span>
                    </p>
                    </CardBody>
                </Card>
                </Col>

                <Col lg="3" md="6" className="mb-4">
                <Card className="card-stats shadow">
                    <CardBody>
                    <Row>
                        <div className="col">
                        <h5 className="card-title text-uppercase text-muted mb-0">
                            Calories Moy.
                        </h5>
                        <span className="h2 font-weight-bold mb-0">
                            {stats.moyenneCalories > 0 ? Math.round(stats.moyenneCalories) : 'N/A'}
                        </span>
                        </div>
                        <Col className="col-auto">
                        <div className="icon icon-shape bg-gradient-success text-white rounded-circle shadow">
                            <i className="fas fa-utensils" />
                        </div>
                        </Col>
                    </Row>
                    <Progress
                        className="my-2"
                        value={(stats.moyenneCalories / 2000) * 100}
                        color="success"
                    />
                    <p className="mt-3 mb-0 text-muted text-sm">
                        <span className="text-nowrap">Objectif: 2000 kcal</span>
                    </p>
                    </CardBody>
                </Card>
                </Col>

                <Col lg="3" md="6" className="mb-4">
                <Card className="card-stats shadow">
                    <CardBody>
                    <Row>
                        <div className="col">
                        <h5 className="card-title text-uppercase text-muted mb-0">
                            Activité
                        </h5>
                        <span className="h2 font-weight-bold mb-0">{stats.activite}</span>
                        </div>
                        <Col className="col-auto">
                        <div className="icon icon-shape bg-gradient-warning text-white rounded-circle shadow">
                            <i className="fas fa-walking" />
                        </div>
                        </Col>
                    </Row>
                    <p className="mt-3 mb-0 text-muted text-sm">
                        <span className="text-success mr-2">
                        <i className="fas fa-arrow-up" /> 8%
                        </span>
                        <span className="text-nowrap">Sessions enregistrées</span>
                    </p>
                    </CardBody>
                </Card>
                </Col>
            </Row>

            {/* Dernières Habitudes */}
            <Row>
                <Col lg="8">
                <Card className="shadow">
                    <CardHeader className="bg-transparent">
                    <Row className="align-items-center">
                        <div className="col">
                        <h3 className="mb-0">Dernières Habitudes</h3>
                        </div>
                    </Row>
                    </CardHeader>
                    <CardBody>
                    {habitudes.slice(0, 5).map((habitude) => (
                        <div key={habitude.id} className="d-flex align-items-center mb-3 p-3 border rounded">
                        <div className="mr-3">
                            <i className={`${obtenirIconeType(habitude.type)} fa-2x text-${obtenirCouleurType(habitude.type)}`}></i>
                        </div>
                        <div className="flex-grow-1">
                            <h6 className="mb-1">{habitude.title}</h6>
                            <small className="text-muted">{habitude.description || "Aucune description"}</small>
                        </div>
                        <Badge color={obtenirCouleurType(habitude.type)}>
                            {habitude.type}
                        </Badge>
                        </div>
                    ))}
                    {habitudes.length === 0 && (
                        <div className="text-center py-4 text-muted">
                        <i className="fas fa-inbox fa-3x mb-3"></i>
                        <p>Aucune habitude enregistrée</p>
                        </div>
                    )}
                    </CardBody>
                </Card>
                </Col>
                <Col lg="4">
                <Card className="shadow">
                    <CardHeader className="bg-transparent">
                    <h3 className="mb-0">Répartition</h3>
                    </CardHeader>
                    <CardBody>
                    {['Sommeil', 'Nutrition', 'ActivitéPhysique', 'Stress'].map((type) => (
                        <div key={type} className="mb-3">
                        <div className="d-flex justify-content-between mb-1">
                            <span className="text-sm">
                            <Badge color={obtenirCouleurType(type)} className="mr-2">
                                <i className={`${obtenirIconeType(type)} mr-1`}></i>
                            </Badge>
                            {type}
                            </span>
                            <span className="text-muted text-sm">
                            {habitudes.filter(h => h.type === type).length}
                            </span>
                        </div>
                        <Progress
                            value={(habitudes.filter(h => h.type === type).length / Math.max(habitudes.length, 1)) * 100}
                            color={obtenirCouleurType(type)}
                            className="mb-2"
                        />
                        </div>
                    ))}
                    </CardBody>
                </Card>
                </Col>
            </Row>
            </TabPane>

            {/* TAB 2: TOUTES LES HABITUDES */}
            <TabPane tabId="2">
            <Row>
                <Col lg={selectedHabitude ? "8" : "12"}>
                {/* Formulaire */}
                <Card className="shadow mb-4">
                    <CardHeader>
                    <h3 className="mb-0">
                        {selected ? '✏️ Modifier une Habitude' : '➕ Ajouter une Nouvelle Habitude'}
                    </h3>
                    </CardHeader>
                    <CardBody>
                    <HabitudeForm
                        onSuccess={() => {
                        chargerHabitudes();
                        setSelected(null);
                        }}
                        selected={selected}
                    />
                    </CardBody>
                </Card>

                {/* Liste des habitudes */}
                <Card className="shadow">
                    <CardHeader className="border-0">
                    <Row className="align-items-center">
                        <div className="col">
                        <h3 className="mb-0">Mes Habitudes</h3>
                        </div>
                        <div className="col text-right">
                        <Badge color="primary" pill>
                            {habitudes.length} habitude{habitudes.length > 1 ? 's' : ''}
                        </Badge>
                        </div>
                    </Row>
                    </CardHeader>
                    <CardBody className="px-0">
                    {loading ? (
                        <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="sr-only">Chargement...</span>
                        </div>
                        <p className="text-muted mt-2">Chargement des habitudes...</p>
                        </div>
                    ) : habitudes.length === 0 ? (
                        <div className="text-center py-5">
                        <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                        <h4 className="text-muted">Aucune habitude enregistrée</h4>
                        <p className="text-muted">Commencez par ajouter votre première habitude !</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                        <table className="table align-items-center table-flush">
                            <thead className="thead-light">
                            <tr>
                                <th scope="col">Habitude</th>
                                <th scope="col">Type</th>
                                <th scope="col">Description</th>
                                <th scope="col">Données</th>
                                <th scope="col" />
                            </tr>
                            </thead>
                            <tbody>
                            {habitudes.map((habitude) => (
                                <tr 
                                key={habitude.id} 
                                style={{ cursor: 'pointer' }}
                                onClick={() => setSelectedHabitude(habitude)}
                                >
                                <th scope="row">
                                    <div className="media align-items-center">
                                    <div className="media-body">
                                        <span className="mb-0 text-sm">{habitude.title}</span>
                                    </div>
                                    </div>
                                </th>
                                <td>
                                    <Badge color={obtenirCouleurType(habitude.type)}>
                                    {habitude.type}
                                    </Badge>
                                </td>
                                <td>
                                    <div className="text-muted">
                                    {habitude.description || "Aucune description"}
                                    </div>
                                </td>
                                <td>
                                    <div className="d-flex align-items-center">
                                    {habitude.calories && (
                                        <span className="mr-2 text-success">
                                        <i className="fas fa-fire mr-1"></i>
                                        {habitude.calories} kcal
                                        </span>
                                    )}
                                    {habitude.hours && (
                                        <span className="mr-2 text-info">
                                        <i className="fas fa-bed mr-1"></i>
                                        {habitude.hours}h
                                        </span>
                                    )}
                                    {habitude.steps && (
                                        <span className="text-warning">
                                        <i className="fas fa-walking mr-1"></i>
                                        {habitude.steps} pas
                                        </span>
                                    )}
                                    </div>
                                </td>
                                <td className="text-right">
                                    <Button
                                    size="sm"
                                    color="primary"
                                    className="mr-2"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelected(habitude);
                                    }}
                                    >
                                    <i className="fas fa-edit"></i>
                                    </Button>
                                    <Button
                                    size="sm"
                                    color="danger"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        supprimerHabitude(habitude.idSimple);
                                    }}
                                    >
                                    <i className="fas fa-trash"></i>
                                    </Button>
                                </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        </div>
                    )}
                    </CardBody>
                </Card>
                </Col>

                {/* Sidebar des détails */}
                {selectedHabitude && (
                <Col lg="4">
                    <Card className="shadow sticky-top" style={{ top: '100px' }}>
                    <CardHeader className="border-0">
                        <Row className="align-items-center">
                        <div className="col">
                            <h3 className="mb-0">Détails</h3>
                        </div>
                        <div className="col text-right">
                            <Button
                            close
                            onClick={() => setSelectedHabitude(null)}
                            />
                        </div>
                        </Row>
                    </CardHeader>
                    <CardBody>
                        <div className="text-center mb-4">
                        <Badge 
                            color={obtenirCouleurType(selectedHabitude.type)} 
                            className="badge-circle badge-xl mb-3"
                        >
                            <i className={obtenirIconeType(selectedHabitude.type)}></i>
                        </Badge>
                        <h4 className="text-primary">{selectedHabitude.title}</h4>
                        <Badge color={obtenirCouleurType(selectedHabitude.type)}>
                            {selectedHabitude.type}
                        </Badge>
                        </div>

                        {selectedHabitude.description && (
                        <div className="mb-4">
                            <h6 className="heading-small text-muted mb-2">Description</h6>
                            <p className="text-sm">{selectedHabitude.description}</p>
                        </div>
                        )}

                        <div className="mb-4">
                        <h6 className="heading-small text-muted mb-3">Données</h6>
                        {selectedHabitude.calories && (
                            <div className="d-flex justify-content-between mb-2">
                            <span className="text-sm">Calories</span>
                            <strong className="text-success">{selectedHabitude.calories} kcal</strong>
                            </div>
                        )}
                        {selectedHabitude.hours && (
                            <div className="d-flex justify-content-between mb-2">
                            <span className="text-sm">Heures de sommeil</span>
                            <strong className="text-info">{selectedHabitude.hours}h</strong>
                            </div>
                        )}
                        {selectedHabitude.steps && (
                            <div className="d-flex justify-content-between">
                            <span className="text-sm">Pas effectués</span>
                            <strong className="text-warning">{selectedHabitude.steps} pas</strong>
                            </div>
                        )}
                        </div>

                        <div className="text-center">
                        <Button
                            color="primary"
                            className="mr-2"
                            onClick={() => {
                            setSelected(selectedHabitude);
                            setSelectedHabitude(null);
                            }}
                        >
                            <i className="fas fa-edit mr-2"></i>
                            Modifier
                        </Button>
                        <Button
                            color="danger"
                            outline
                            onClick={() => supprimerHabitude(selectedHabitude.idSimple)}
                        >
                            <i className="fas fa-trash mr-2"></i>
                            Supprimer
                        </Button>
                        </div>
                    </CardBody>
                    </Card>
                </Col>
                )}
            </Row>
            </TabPane>
        </TabContent>
        </Container>
    </div>
    </>
);
};

export default HabitudeList;
