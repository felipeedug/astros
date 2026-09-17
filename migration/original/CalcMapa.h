// CalcMapa.h: interface for the CCalcMapa class.
//
//////////////////////////////////////////////////////////////////////

#if !defined(AFX_CALCMAPA_H__BA0F5E9A_DEAE_4576_9415_1880A41E327E__INCLUDED_)
#define AFX_CALCMAPA_H__BA0F5E9A_DEAE_4576_9415_1880A41E327E__INCLUDED_

#if _MSC_VER > 1000
#pragma once
#endif // _MSC_VER > 1000

#include "Afxtempl.h"
#include "Defines.h"

extern CAstrovidaApp theApp;

class CCdLFC;
class CArrayEntidades;

class CCalcMapa  
{
public:
	CCalcMapa();
	virtual ~CCalcMapa();

	BOOL	bfProgressao,	// Se se trata de mapa que envolve progressão
			bfArcoSolar,	// Are we doing -p0 solar arc chart? 
			bfSideral,		// Se Sideral,
			bfGeodesico,	// Se Geodésico
			bfCusp, 
			bfUraniano,		// Se inclui ou não objetos transuranianos( não consideradas nesta versão )
			bfVelocidade,	
			bfHouseAngle,
			bfFlip,
			bfDecan,
			bfNavamsa,
			bfNodoVerdadeiro, //bfTrueNode,
			bfPlacalcAst,
			bfNoEphFile; 

	int ma_nObjetoCentral; 
	int nArabicNight;
	int ma_nHarmonicos;
	int nObjOnAsc;
	BOOL bFlagFALSE;
	BOOL ma_bfRetorno;
	BOOL ma_bfLFC;

	double  m_adEspacial_x[oNorm+1], m_adEspacial_y[oNorm+1], m_adEspacial_z[oNorm+1], m_adForca[objMax];
	POSICAO_MAPA sChartPos0;
	BOOL m_bCalcFs;

	int	m_nDia,m_nMes,m_nAno ;
	double m_dLatitude,m_dLongitude;
	double m_dLat,m_dLon;
	double m_dEscTempo;			// Escala de tempo
	double m_dObliqEcliptica;	// Obliqüidade da eclíptica

	double m_dOffSet;			// Sol Médio 
	double m_dJD;				// Dia Juliano
	double m_dJDProgress;
	double m_dProgressDay;		// Dia progredido

	double m_dMC;				// Meio do Céu 
	double m_dAsc;				// Ascendente
	double m_dRA;				// Ascensão reta
	double m_dPosVertice;

	double m_dOffSetGrauSideral;	// Offset angular para Sideral
	double m_dOffSetZodiacal;		// Offset angular para mudança de localidade ( deslocamento )
	double m_dHora;
	double m_dZonaTempo;
	double m_dHoraVerao;

	int m_nPassoEfemeride;	// Número de dias entre duas entradas na efenéride = 80 dias

	CStringArray m_aoszSistema, m_aoszObjetos, m_aoszSignos;

	double m_thelup;  
	double m_dMean_ekl;
	double m_ekl;
	double m_dNutacao;

	ELEMENTOS m_arrayEle[ MARS + 1 ];
	double m_array_sa[SDNUM];
	
	CFile m_ExtEfem;
	CFile m_ChiEfem;
	CFile m_AstEfem;

	BOOL m_bFlagEfemerides;

	BOOL AbreEfemerides();
	BOOL VerificaData();
	void FechaEfemerides();
	void SetValoresIniciais();

	BOOL PegaPosEfemeridePlanetasExternos( double dNumDiasJuliano );
	BOOL PegaPosEfemerideAsteroides( double dNumDiasJuliano );
	BOOL PegaPosEfemerideChiron( double dNumDiasJuliano );

	void   CalcularRetorno( BOOL bSol, double dLongEclipticaRetorno, double dLat, double dLon, double dZona, double dHoraVerao, int* nDia,int* nMes, int* nAno, double* dHora );

/*
	void GeraTabelaLuaForaDeCurso( int nAno, double dZona, double dHoraVerao,CProgressCtrl* pPGStatus );
	void GeraTabelaLuaForaDeCurso( int nAnoIni, int nAnoFim, double dZona, double dHoraVerao,CProgressCtrl* pPGStatus );
	void GeraTabelaLuaForaDeCurso( int nDiaIni, int nMesIni, int nAnoIni, double dHoraDecIni,  
		  					       int nDiaFim, int nMesFim, int nAnoFim, double dHoraDecFim,
							       double dZona, double dHoraVerao,CProgressCtrl* pPGStatus );
*/
	double CalculaFimLuaForaDeCurso( int& nDia, int& nMes, int& nAno, double dLat, double dLon, double& dHoraMin, double dZona, double dHoraVerao );
	void   CalculaInicioLuaForaDeCurso( int& nDia, int& nMes, int& nAno, double dLat, double dLon, double& dHoraMin, double dZona, double dHoraVerao );

	void CalcularMapa( int nDia,int nMes, int nAno, double dLat, double dLon, double dHora, double dZona, double dHoraVerao, CArrayEntidades *paEntidades = NULL  );
	void CalcularCasas( BOOL bDetermineData );
	void CalcularAstros();
	void ComputarPlanetas();
	
	void ProcessarPlanetas( int index, double dAberracao );
	void ComputarLua( double* moonlo, double* moonla, double* nodelo, double* nodela );
	void CalcularParteDaFortuna();

	double ProcessaEntrada( BOOL bDate );
	void ComputarVariaveis();
	double CuspideDoMeioCeu();
	double CuspideDoAscendente();
	double CuspideDoPontoEste();
	void ComputarCasas( int nSistema );
	void HouseKoch();
	void HouseEqual();
	void HouseCampanus();
	void HouseMeridian();
	void HouseRegiomontanus();
	void HousePorphyry();
	void HouseMorinus();
	void HouseAlcabitius();
	void HouseEqualMidheaven();
	void HousePorphyryNeo();
	void HouseWhole();
	void HouseVedic();
	void HouseNull();
	void HousePlacidus();
	void CalculoCasaTopocentrico();
	double CuspideTopocentrico( double dAngulo );
	void CalculaQuaisCasas();
	int QualCasa( double rDeg );
	double SignoDecano( double dDeg );
	double  Navamsa( double dDeg );
	void ListaTeste();

	long DiaMesAnoToJuliano( int dia, int mes, int ano );
	void JulianoToDiaMesAno( double dJD, int* dia, int* mes, int* ano );
	double DiasJulianosAbsolutos( int dia, int mes, int ano, double hora, int gregflag );
	void ReversoJuliano( double jd, int gregflag, int* jdia, int *jmes, int* jano, double* jut );

	double HmsToDec( double dHms );
	CString RadToHm( double dRad );
	CString RadToHms( double dRad ); 
	CString DecToHms( double dDec ); 
	double  DecToHora( double dDec );
	CString DecToHm( double dDec ); 
	CString PlanetToCusp ( double dValor );

	double Sinal( double dValor );
	int ComputaSdeZ( double dVal );
	double ComputaZdeS ( int nVal );
	double ToTropical( double dDeg );
		
	double MinimaDistancia( double deg1, double deg2 );
	double MinimaDiferenca( double deg1, double deg2 );
	double CalculoAngulo( double dx, double dy);
	long DivisaoParaBaixo( long x, long y );
	double Mod( double d );
	double ModRad( double r );
	int    Mod12( int i );
	double Mod90( double d );

	void PolarToRectangular(double dA, double dR, double* dX, double* dY );
	void RectangularToPolar(double dX, double dY, double* dA, double* dR );
	double RectangularToSpherical( double B, double L, double O );
	void   SphericalToRectangular( double r, double azi, double alt, double* rx, double* ry, double* rz );
	double ValorToCoefQuad( double r0, double r1, double r2 );
	void RectangularToSpherical2(double AP, double AN, double INQ, double* X, double* Y, double* G );
	void TransformaCoordenadas( double* azi, double* alt, double tilt);
	void CalculaCorrecaoErro( int ind, double* x, double* y, double* z );
	int IndexOrbElemDoObjeto( int obj ); 
	
	double NormalizaDeg( double p );
	double ResolveKepler( double t, double ex, double err );
	double smod8360( double x );
	double mod8360( double x );
	double diff8360( double a, double b );
	double TesteProximidadeZero( double x );

	void ComputarPlanetasEfemerides( double dEscTempo );
	BOOL ComputarPosicaoPlanetas( int ind, double jd, int helio, double* obj, double* objalt, double* dir, double* space );
	double LeDiferencTempo( double jd_ad );
	BOOL CalculoPrincipal( int planet, double jd_ad, int flag, double* alng, double* arad, double* alat, double* alngspeed );
	void PosHeliocentricaUp( double jd_ad );
	BOOL PosHeliocentrica( int planet, double t, double* al, double* ar, double* az, double* alp, double* arp, double* azp );
	void CalcPerturbacao( KOR* k, double* al, double* ar, double lk, double rk, double man );
	BOOL OuterPosHeliocentrica( int planet, double jd_ad, double* al, double* ar, double* az, double* alp, double* arp, double* azp );
	void Interpolar( int n, int o, double p, double x[], double*axu, double* adxu );
	void CalculoObjetoLua( double* al, double* ar, double* az );
	void HelioToGeocentrico( double lngearth, double radearth, double lng, double rad, double zet, double* alnggeo, double* aradgeo );

	static double Fix( double dValor, int nPrecis );
};

#endif // !defined(AFX_CALCMAPA_H__BA0F5E9A_DEAE_4576_9415_1880A41E327E__INCLUDED_)
