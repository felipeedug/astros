#if !defined(_DEFINES_H_)
#define _DEFINES_H_

#if _MSC_VER > 1000
#pragma once
#endif // _MSC_VER > 1000

#define LONGE			9.0E10
#define	nLONGE			9000000

#define TGC_dLONGE		9.0E10
#define	TGC_nLONGE		9000000

#define _AR 0.0174532925199433

#define MAXSAT 30

#define LIMITEPLANETAASTEROIDS 16

#define K_VIEWPORT_FACTOR 10

#define MPI		  1.5707963267948966	
#define TPI		  4.7123889803846898	
#define PI        3.14159265358979323846
#define PIHALF    ( PI/2.0)
#define DPI		  ( PI*2.0)
#define DEGMAX    360.0
#define DEGHALF   180.0
#define DEGQUAD   90.0
#define DEGRAD      ( DEGHALF/PI)
#define DEGTORAD(r) ( ( r)/( 180.0/PI) )
#define RADTODEG(r) ( ( r)*( 180.0/PI) )

#define ZPI  0.
#define UM_GRAU      (1.*PI/180.)
#define CINCO_GRAUS  (5.*PI/180.)
#define QUINZE_GRAUS (15.*PI/180.)
#define TRINTA_GRAUS (30.*PI/180.)
#define DOIS_MEIO_GRAUS ( 2.5*PI/180.)
#define UM_VINTE_CINCO (1.25*PI/180.)
#define DEZ_GRAUS (10.*PI/180.)

// Tipos possíveis para os campos de uma tabela

#define FT_VARCHAR			0
#define FT_TEXT				1
#define FT_INTEGER			4
#define FT_FLOAT			6
#define FT_DATETIME			7
#define FT_BOOL				9

#define mJaneiro	1
#define mFevereiro	2
#define mMarco		3
#define mAbril		4
#define mMaio		5
#define mJunnho		6
#define mJulho		7
#define mAgosto		8
#define mSetembro	9
#define mOutubro	10
#define mNovembro	11
#define mDezembro	12

#define dSinal2( r)  ( ( r) < 0.0 ? -1.0 : 1.0 )
#define bEntreObjetos( v, v1, v2 )  ( ( v) >= ( v1) && ( v) <= ( v2) )

#define AXIS       23.44578889
#define rSmall     (1.7453E-09)
#define rLarge     10000.0
#define cSign      12
#define cObj       87			// sem as Estrêlas nâo chega a este valor, talvez até uranHi
#define cObjInt    uranHi
#define objMax     (cObj+1)

#define cPlanet oVes
#define cThing  oLil
#define oMain   10
#define oCore   20
#define cUran   8
//#define cStar   47
#define cuspLo  21
#define cuspHi  32
#define uranLo  33
#define uranHi  40
#define oNorm   uranHi

// Signos Zodiacais
#define sAri 1
#define sTau 2
#define sGem 3
#define sCan 4
#define sLeo 5
#define sVir 6
#define sLib 7
#define sSco 8
#define sSag 9
#define sCap 10
#define sAqu 11
#define sPis 12

// Objetos ( Sol, Lua, Planetas, Asteróides e Ângulos )
#define oEar 0
#define oSun 1
#define oMoo 2
#define oMer 3
#define oVen 4
#define oMar 5
#define oJup 6
#define oSat 7
#define oUra 8
#define oNep 9
#define oPlu 10
#define oChi 11
#define oCer 12
#define oVes 15
#define oNod 16
#define oLil 17
#define oSou 17
#define oFor 18
#define oVtx 19
#define oEP  20
#define oAsc 21
#define oNad 24
#define oDes 27
#define oPri 28
#define oCau 29
#define oMC  30


#define anoJ2G     1582
#define mesJ2G     mOutubro
#define diaJ2G1    4
#define diaJ2G2    15

#define HUGE8 1.7E+308			// Maior valor para double 
#define TANERRLIMIT 1.0E-10     // Utilizado para verificar argumentos muito próximo de PI
#define NEAR_ZERO   1.0E-16     // Utilizado para comparar divisores muito próximo de zero

#define fDEGTORAD	0.0174532925199433
#define fRADTODEG	57.2957795130823
#define fDEGTOMSEC  3600000.0  // Fator de conversão Graus -> milisegundos
#define fAUTOINT     1e7       

#define SUN       0   // Utilizado também como Terra
#define EARTH     0
#define MOON      1
#define MERCURY   2
#define VENUS     3
#define MARS      4
#define JUPITER   5
#define SATURN    6
#define URANUS    7
#define NEPTUNE   8
#define PLUTO     9
#define MEAN_NODE 10
#define TRUE_NODE 11
#define CHIRON    12
#define LILITH    13
#define DEMETER   14
#define PALLAS    15
#define JUNO      16
#define VESTA     17

#define CALC_ALL_PLANET_BITS ((1 << 13) - 1)	// bits 0..12 setados 

#define J2000 2451545.0							// Época da efeméride JPL DE200, absoluto
#define J1950  2433282.423						// Época da efeméride JPL DE102
#define JUL_OFFSET 2433282.0					// offset para Dia Juliano no calendário relativo
#define EPOCA1850 -36524.0						// Júpiter,Saturn 0 jan 1850, 12:00
#define EPOCA1900 -18262.0						// planetas internos  0 jan 1900, 12:00
#define EPOCA1950  0.0							// Plutão    0 jan 1950, 12:00. Esta é a origem do Calendário Juliano relativo
#define EPOCA1960 3653.0						// Urano,Netuno 1 jan 1960, 12:00
#define ENDMARK 99								// Utilizado para marcar o final dos termos de perturbações
#define NODE_INTERVAL 0.005						// dias, = 7m20s
#define MOON_SPEED_INTERVAL 0.0001				// 8.64 segundos depois

#define SDNUM			20
#define NUM_MOON_CORR	93

#define TIDAL_26		TRUE	
#define MOON_TEST_CORR	FALSE	

#define CALC_BIT_HELIO			1				// geocentrico/heliocentrico 
#define CALC_BIT_NOAPP			2				// posições aparente/verdadeira
#define CALC_BIT_NONUT			4				// Equação verdadeira/Média de data
#define CALC_BIT_EPHE			8				// Tempo universal/ das efemérides
#define CALC_BIT_SPEED			16				// com/sem velocidade
#define CALC_BIT_BETA			32				// com/sem Latitude
#define CALC_BIT_RGEO			64				// com/sem rgeo relativo
#define CALC_BIT_RAU			128				// com/sem raio verdadeiro


typedef struct _ChartPositions 
{
	double LongitEcliptica[objMax];				// Longitude Eclíptica
	double LatitEcliptica[objMax];				// Latitude Eclíptica
	double AscensaoReta[objMax];				// Ascensão Reta( Sistema de Coordenadas Equatoriais )
	double Declinacao[objMax];					// Delinação    ( Sistema de Coordenadas Equatoriais ) 
	double Velocidade[objMax];					// Velocidade de retrogradação
	double cusp[cSign+1];						// Posição da cúspides
	int    house[objMax];						// Casa na qual o objeto está ou pertence
} POSICAO_MAPA;


typedef struct _ElementosOrbitais
{
	double ma0, ma1, ma2;						// Anomalia média
	double ec0, ec1, ec2;						// Excentricidade
	double sma;									// Semi eixo maior
	double ap0, ap1, ap2;						// Arqgumento do periélio
	double an0, an1, an2;						// Nodo ascendente
	double in0, in1, in2;						// Inclinação
} ELEMENTOS_ORBITAIS;

/***********************************************************************************************************************
	Cálculo com Efemérides
***********************************************************************************************************************/
typedef struct _Elementos  
{
  double	tj,					// Centenário a partir da época
			lg,					// Longitude média em graus de arco
			pe,					// Longitude do periélio em graus de arco
			ex,					// Excentricidade em graus de arco
			kn,					// Longitude do nodo  em graus de arco
			in,					// Inclinação da órbita em graus de arco
			ma;					// Anomalia média em graus de arco
}ELEMENTOS;

typedef struct _Dado_Elemento
{
	double	axis,				// Distância média em u.a, A(N) básico
			period,				// Número de dias para cada revolução, P(N) básico
			epoch,				// Dia Juliano relativo da época, Ep(N) básico
								// T = distância à época, em séculos julianos, 36525 dias
			lg0,lg1,lg2,lg3,	// graus(época), graus/dia, segundos/T^2,segundos/T^3 
								// Pd(N,0..2) básico, lg3 não estava presente
			pe0,pe1,pe2,pe3,	// graus(época), segundos/T,  segundos/T^2,segundos/T^3 
								// Pd(N,3..5) básico, pe3 não presente
			ex0,ex1,ex2,		// ecl(época), 1/T, 1/T^2
								// Pd(N,6..8) básico
			kn0,kn1,kn2,kn3,	// node(época),segundos/T,  segundos/T^2,segundos/T^3
								// Pd(N,9..11) básico, kn3 não estava presente
			in0,in1,in2;		// incl(época),1/T, 1/T^2
								// Pd(N,12..14) básico
} DADO_ELEMENTO;

typedef struct _kor 
{
	int     j, i;
			double lampl;		// amplitude da perturbação em longitude, segundos de arco
			double lphase;		// fase da perturbação in long, degrees 
			long   rampl;		// amplitude da perturbação em unidade raio, Nona casa do log
			double rphase;		// fase da perturbação em unidade raio, graus
			int    k;			// índice do sa[] 
} KOR;

typedef struct _sdat			// 0..19 anomalia média dos planetas causadoras da perturbação Sd(0..19,0..1) ( unidade básica )
{   
  double	sd0,				// Anomalia média na época 1850 
			sd1;				// Graus/Ano
} SDAT;

// Dados de correção para a Lua; revisado 30-jul-88: todas as longitude a 0.3" 
typedef struct _m45dat 
{
  int		i0,i1,i2,i3;

  double	lng,lat,par;
} M45DAT;


typedef struct _m5dat {
  double  lng;
  int  i0,i1,i2,i3;
} M5DAT;

#endif 
