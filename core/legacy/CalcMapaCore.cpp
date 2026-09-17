// CalcMapa.cpp: implementation of the CCalcMapa class.
//
//////////////////////////////////////////////////////////////////////

#include "mfc_compat.h"
#include <iostream>
#include "math.h"
#include "CalcMapaCore.h"
#include "Data.h"
#include "ExternData.h"

#ifdef _DEBUG
#undef THIS_FILE
static char THIS_FILE[]=__FILE__;
#define new DEBUG_NEW
#endif

CONST int rErrorCount[ oPlu-oJup+1 ]  = { 11, 5, 4, 4, 4 };
CONST int rErrorOffset[ oPlu-oJup+1 ] = { 0, 72, 72+51, 72+51+42, 72+51+42+42 };
CONST double rErrorData[72+51+42*3] =	{	
											-.001,-.0005,.0045,.0051,581.7,-9.7,-.0005,2510.7,-12.5,-.0026,1313.7,-61.4,
											0.0013,2370.79,-24.6,-.0013,3599.3,37.7,-.001,2574.7,31.4,-.00096,6708.2,
											-114.5,-.0006,5499.4,-74.97,-.0013,1419,54.2,.0006,6339.3,-109,.0007,4824.5,
											-50.9,.0020,-.0134,.0127,-.0023,676.2,.9,.00045,2361.4,174.9,.0015,1427.5,
											-188.8,.0006,2110.1,153.6,.0014,3606.8,-57.7,-.0017,2540.2,121.7,-.00099,
											6704.8,-22.3,-.0006,5480.2,24.5,.00096,1651.3,-118.3,.0006,6310.8,-4.8,.0007,
											4826.6,36.2,										// Erros de J�piter 

											-.0009,.0037,0,.0134,1238.9,-16.4,-.00426,3040.9,-25.2,.0064,1835.3,36.1,
											-.0153,610.8,-44.2,-.0015,2480.5,-69.4,-.0014,.0026,0,.0111,1242.2,78.3,
											-.0045,3034.96,62.8,-.0066,1829.2,-51.5,-.0078,640.6,24.2,-.0016,2363.4,
											-141.4,.0006,-.0002,0,-.0005,1251.1,43.7,.0005,622.8,13.7,.0003,1824.7,-71.1,
											.0001,2997.1,78.2,									// Erros de Saturno

											-.0021,-.0159,0,.0299,422.3,-17.7,-.0049,3035.1,-31.3,-.0038,945.3,60.1,
											-.0023,1227,-4.99,.0134,-.02186,0,.0317,404.3,81.9,-.00495,3037.9,57.3,.004,
											993.5,-54.4,-.0018,1249.4,79.2,-.0003,.0005,0,.0005,352.5,-54.99,.0001,3027.5,
											54.2,-.0001,1150.3,-88,								// Erros de Urano

											0.1832,-.6718,.2726,-.1923,175.7,31.8,.0122,542.1,189.6,.0027,1219.4,178.1,
											-.00496,3035.6,-31.3,-.1122,.166,-.0544,-.00496,3035.3,58.7,.0961,177.1,-68.8,
											-.0073,630.9,51,-.0025,1236.6,78,.00196,-.0119,.0111,.0001,3049.3,44.2,-.0002,
											893.9,48.5,.00007,1416.5,-25.2,						//Erros de Netuno

											-.0426,.073,-.029,.0371,372,-331.3,-.0049,3049.6,-39.2,-.0108,566.2,318.3,
											0.0003,1746.5,-238.3,-.0603,.5002,-.6126,.049,273.97,89.97,-.0049,3030.6,61.3,
											0.0027,1075.3,-28.1,-.0007,1402.3,20.3,.0145,-.0928,.1195,.0117,302.6,-77.3,
											0.00198,528.1,48.6,-.0002,1000.4,-46.1				// Erros de Plut�o
										};


//////////////////////////////////////////////////////////////////////
// Construction/Destruction
//////////////////////////////////////////////////////////////////////

CCalcMapa::CCalcMapa()
{
	m_bFlagEfemerides = FALSE;

	bfProgressao = FALSE;	// Verificar este valor
	bfArcoSolar = FALSE;	// Verificar este valor
	bfSideral = FALSE;		// Verificar este valor
	bfGeodesico = FALSE;	// Verificar este valor
	bFlagFALSE = TRUE;		// O que � isso?
	bfCusp = TRUE;
	bfUraniano = FALSE;
	bfVelocidade = FALSE;		// ?
	bfHouseAngle =	FALSE;		// ?
	bfFlip = FALSE;				// ?
	bfDecan = FALSE;			// ?
	bfNavamsa = FALSE;			// ?
	bfNodoVerdadeiro = TRUE;
	bfPlacalcAst = FALSE,		// ?
	bfNoEphFile = FALSE;
	ma_bfRetorno = FALSE;
	ma_bfLFC = FALSE;
	m_bCalcFs = TRUE;

	ma_nObjetoCentral = 0;			// Verificar
	nArabicNight = 0;		// Verificar
	ma_nHarmonicos = 1;
	nObjOnAsc = 0;

	m_thelup = HUGE8;  

	m_nPassoEfemeride = 80;

	m_aoszSistema.Add( "Placidus" );
	m_aoszSistema.Add( "Koch" ); 
	m_aoszSistema.Add( "Equal" );
	m_aoszSistema.Add( "Campanus" );
	m_aoszSistema.Add( "Meridian" );
	m_aoszSistema.Add( "Regiomontanus" );
	m_aoszSistema.Add( "Porphyry" );
	m_aoszSistema.Add( "Morinus" );
	m_aoszSistema.Add( "Topocentric" );
	m_aoszSistema.Add( "Alcabitius" );
	m_aoszSistema.Add( "Equal ( MC)" );
	m_aoszSistema.Add( "Neo-Porphyry" );
	m_aoszSistema.Add( "Whole" );
	m_aoszSistema.Add( "Vedic" );
	m_aoszSistema.Add( "Null" );

	m_aoszObjetos.Add( "Terra" );			//0
	m_aoszObjetos.Add( "Sol" );				//1	
	m_aoszObjetos.Add( "Lua" );				//2
	m_aoszObjetos.Add( "Merc�rio" );		//3		
	m_aoszObjetos.Add( "V�nus" );			//4
	m_aoszObjetos.Add( "Marte" );			//5
	m_aoszObjetos.Add( "J�piter" );			//6
	m_aoszObjetos.Add( "Saturno" );			//7	
	m_aoszObjetos.Add( "Urano" );			//8	
	m_aoszObjetos.Add( "Netuno" );			//9
	m_aoszObjetos.Add( "Plut�o" );			//10
	m_aoszObjetos.Add( "Chiron" );			//11
	m_aoszObjetos.Add( "Demeter" );			//12
	m_aoszObjetos.Add( "Pallas" );			//13	
	m_aoszObjetos.Add( "Juno" );			//14
	m_aoszObjetos.Add( "Vesta" );			//15
	m_aoszObjetos.Add( "Cabe�a" );			//16
	m_aoszObjetos.Add( "Lilith" );			//17
	m_aoszObjetos.Add( "Roda" );			//18
	m_aoszObjetos.Add( "Vertex" );			//19
	m_aoszObjetos.Add( "Ponto leste" );		//20
	m_aoszObjetos.Add( "Ascendente" );		//21	
	m_aoszObjetos.Add( "22" );				//22	
	m_aoszObjetos.Add( "23" );				//23	
	m_aoszObjetos.Add( "Nadir" );			//24
	m_aoszObjetos.Add( "25" );				//25	
	m_aoszObjetos.Add( "26" );				//26	
	m_aoszObjetos.Add( "Descendente" );		//27
	m_aoszObjetos.Add( "Pr�apo" );			//28	
	m_aoszObjetos.Add( "Cauda" );			//29	
	m_aoszObjetos.Add( "Meio do C�u" );		//30

	m_aoszSignos.Add( "�ries" );
	m_aoszSignos.Add( "Touro" );
	m_aoszSignos.Add( "G�meos" );
	m_aoszSignos.Add( "C�ncer" );
	m_aoszSignos.Add( "Le�o" );
	m_aoszSignos.Add( "Virgem" );
	m_aoszSignos.Add( "Libra" );
	m_aoszSignos.Add( "Escopi�o" );
	m_aoszSignos.Add( "Sagit�rio" );
	m_aoszSignos.Add( "Capric�rnio" );
	m_aoszSignos.Add( "Aqu�rio" );
	m_aoszSignos.Add( "Peixes" );

	for( int i = 0; i <= cObj; i++ ) 
	{
		nIgnorar[i] = nIgnorar2[i] = FALSE;
	}
}

CCalcMapa::~CCalcMapa()
{

}

#if 0
// C�lculo do dia e hora para o retorno de qualquer objeto
// nObj:         �ndice para objetos como definidos em defines.h: #define oEar 0 #define oSun 1 #define oMoo 2
// dLongRetorno: Valor da longitude ecl�ptica do objeto a ser retornado em Graus decimais
// dLat e dLon : Latitude e Longitude do local 
// *nDia       : Pointers com valor inicial data, ser�o atualizadas com o data que ocorrer� o retorno
// *nMes		
// *nAno
// * dHora		: Pointer que vai receber a hora do retorno
void CCalcMapa::CalcularRetorno( int nObj, double dLongRetorno, double dLat, double dLon, double dZona, double dHoraVerao, int* nDia,int* nMes, int* nAno, double* dHora )
{
	dLongRetorno = RADTODEG( dLongRetorno );	

	ma_bfRetorno = TRUE;

	BOOL bCalcFs = m_bCalcFs;

	////////////////////////////////////////////////////////////////////////////////
	// Verifica se o valor da longitude procurada cai na data indicada
	////////////////////////////////////////////////////////////////////////////////
	double dLongIni, dLongFim;

	double dJD = ( double )DiaMesAnoToJuliano ( *nDia, *nMes, *nAno );

	int ano,mes,dia;

	while ( 1 )
	{
		m_bCalcFs = FALSE;

		JulianoToDiaMesAno( dJD, &dia, &mes, &ano );
		
		m_bCalcFs = bCalcFs;

		CalcularMapa( dia, mes, ano, dLat, dLon, 0.0, dZona, dHoraVerao );

		dLongIni = sChartPos0.LongitEcliptica[ nObj ];

		CalcularMapa( dia, mes, ano, dLat, dLon, 24.0, dZona, dHoraVerao );

		dLongFim = sChartPos0.LongitEcliptica[ nObj ];

		if( ( dLongFim < dLongIni) && ( dLongIni > 270.0 ) )
		{
			dLongFim += 360.0;
		}

		if( dLongRetorno >= dLongIni && dLongRetorno <= dLongFim )
		{
			// Esta na data JD = dJD;
			break;
		}

		if( dLongRetorno < dLongIni )
		{
			// Esta na data anterior a dJD
			dJD--;
		}
		else if( dLongRetorno > dLongFim ) 
		{
			// Esta na data posterior a dJD
			dJD++;
		}
		else
		{
			// Esta na data dJD
			break;
		}
	}

	m_bCalcFs = bCalcFs;

	double dValAnterior = 0.0;  // Para medir a converg�ncia

	double dMenor = 0.0;
	double dMaior = 24.0;
	double dMedia, dHoraMedia;

	BOOL bAries = FALSE;

	if( dLongRetorno > 270.0 &&  dLongRetorno <= 360 )
	{
		bAries = TRUE;
	}

	while( 1 )
	{
		dMedia = ( dMenor + dMaior ) / 2.0;

		dHoraMedia = DecToHora( dMedia );

		CalcularMapa( dia, mes, ano, dLat, dLon, dHoraMedia, dZona, dHoraVerao );

		double dVal = sChartPos0.LongitEcliptica[ nObj ];

		if( bAries && dVal <= 90.0 )
		{
			dVal += 360.0;
		}

		if( fabs( dVal - dLongRetorno ) < 0.000001 || dMedia == 0.0 || dMedia == 24.0 )
		{
			break;
		}

		if( dVal == dValAnterior )
		{
			break;  // N�o est� mais convergindo, considera o valor atual como correto
		}

		if( dVal < dLongRetorno )
		{
			dMenor = dMedia;
		}
		else 
		{
			dMaior = dMedia;
		}

		dValAnterior = dVal;
	}

	*nDia = dia;
	*nMes = mes;
	*nAno = ano;
	*dHora = dHoraMedia;

	ma_bfRetorno = FALSE;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Gera a tabela de Lua fora de curso para o ano especificado
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
void CCalcMapa::GeraTabelaLuaForaDeCurso( int nAno, double dZona, double dHoraVerao,CProgressCtrl* pPGStatus )
{
	GeraTabelaLuaForaDeCurso(  1,  1,  nAno, 0.0,  
							   31, 12, nAno, 24.0,
							   dZona, dHoraVerao,pPGStatus );
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Gera a tabela de Lua fora de curso para o intervalo de anos especificado
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
void CCalcMapa::GeraTabelaLuaForaDeCurso( int nAnoIni, int nAnoFim, double dZona, double dHoraVerao,CProgressCtrl* pPGStatus )
{
	GeraTabelaLuaForaDeCurso(  1,  1,  nAnoIni, 0.0,  
							   31, 12, nAnoFim, 24.0,
							   dZona, dHoraVerao, pPGStatus );
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Gera a tabela de Lua fora de curso para o per�odo especificado. O per�odo pode se estender para fora dos limites 
// especificados. O per�odo inicia-se sempre com o �ltimo aspecto encontrado e com a �ltima passagem de signo para signo
// A tabela consiste de um array de double com seq��ncia Dia Juliano inicial, Dia Juliano final, Dia Juliano inicial,....
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
void CCalcMapa::GeraTabelaLuaForaDeCurso( int nDiaIni, int nMesIni, int nAnoIni, double dHoraDecIni,  
							   int nDiaFim, int nMesFim, int nAnoFim, double dHoraDecFim,
							   double dZona, double dHoraVerao,CProgressCtrl* pPGStatus )
{
	ma_bfLFC = TRUE;

	dHoraVerao = 0.0;

	CHora oHini( dHoraDecIni, TRUE );
	CHora oHfim( dHoraDecFim, TRUE );
	CDiaJuliano oJDIni( nDiaIni, nMesIni, nAnoIni, oHini );
	CDiaJuliano oJDFim( nDiaFim, nMesFim, nAnoFim, oHfim );

	int nInterval = (int) ( oJDFim.GetDiaJuliano() - oJDIni.GetDiaJuliano() ) + 1;

	pPGStatus->SetRange( 0, nInterval );
	
	int nDia,nDiaF;
	int nMes,nMesF;
	int nAno,nAnoF;
	double dHora,dHoraF; 

	nDia = nDiaF = nDiaIni;
	nMes = nMesF = nMesIni;
	nAno = nAnoF = nAnoIni;
	dHora= dHoraF= dHoraDecIni;

	while ( 1 )
	{
		if( theApp.ma_nOperacao == -1 )
		{
			if( AfxMessageBox( _T("Interrompe opera��o?"), MB_ICONQUESTION | MB_YESNO ) == IDYES )
			{
				pPGStatus->SetPos( 0 );
				ma_bfLFC = FALSE;
				return;
			}
		}
		// Obt�m a data e hora do final da LFC 
		nDia = nDiaF;
		nMes = nMesF;
		nAno = nAnoF;
		dHora = dHoraF;

		CalculaFimLuaForaDeCurso( nDia, nMes, nAno, 0.0, 0.0, dHora, dZona, dHoraVerao );

		double dValor = Fix( sChartPos0.LongitEcliptica[ oMoo ], 2 ); 

		int idx = (int)(dValor / 30.0);

		if( idx > 11 )
		{
			idx = 0;
		}
		
		CString oszSigno = m_aoszSignos.GetAt( idx );

		// Prepara para o pr�ximo final de per�odo

		CHora oHn( dHora, FALSE );

		CDiaJuliano oAux( nDia, nMes, nAno, oHn );

		// Soma um dia, porque em um dia n�o h� mudan�a de signo e avan�a o suficiente para n�o repetir data

		oAux.JulianoToDiaMesAno( oAux.GetDiaJuliano() + 1.0, nDiaF, nMesF, nAnoF, dHoraF );

		//CString osz;
		//osz.Format("%02d/%02d/%04d Signo=%15.15s\n", nDia, nMes, nAno,oszSigno );
		//TRACE( osz );

		CHora oHf( dHora, FALSE );
		CDiaJuliano oJDf( nDia, nMes, nAno, oHf );

		// Obt�m a data e hora do in�cio da LFC 
		CalculaInicioLuaForaDeCurso( nDia, nMes, nAno, 0.0, 0.0, dHora, dZona, dHoraVerao );

		CHora oHi( dHora, FALSE );
		CDiaJuliano oJDi( nDia, nMes, nAno, oHi );

		int nVal = (int) ( oJDi.GetDiaJuliano() - oJDIni.GetDiaJuliano() );

		if( nVal > 0 )
		{
			pPGStatus->SetPos( nVal );
		}

		// Sempre aos pares

		LFC* pLFC = new LFC;

		// Trunca para minuto de precis�o
		oJDi.PrecisaoMinuto();
		oJDf.PrecisaoMinuto();

		pLFC->dJDIni = oJDi.GetDiaJuliano();
		pLFC->dJDFin = oJDf.GetDiaJuliano(); 

		memset( pLFC->lpszSigno,'\0',15 );
		strcpy( pLFC->lpszSigno, oszSigno.GetBuffer(0) );

		ma_asLFC.Add( pLFC );

		if( oJDf.GetDiaJuliano() >= oJDFim.GetDiaJuliano() )
		{
			break;
		}
	}

	pPGStatus->SetPos( nInterval );

	ma_bfLFC = FALSE;
}
*/

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Dado o dia, mes, ano e hora, calcula a data e hora em que a Lua entra no pr�ximo signo
// Esta data coresponde ao final do per�odo no qual a Lua est� fora de curso
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
double CCalcMapa::CalculaFimLuaForaDeCurso( int& nDia, int& nMes, int& nAno, double dLat, double dLon, double& dHora, double dZona, double dHoraVerao )
{
	dHoraVerao = 0.0;

	CHora oHora( dHora, TRUE );  // dHora no formato Decimal

	CDiaJuliano oJD( nDia, nMes, nAno, oHora );

	double dDJ = oJD.GetDiaJuliano();

	// Calcula a posi��o atual da lua 
	CalcularMapa(  nDia,nMes, nAno, dLat, dLon, oHora.GetHms(), dZona, dHoraVerao );

	// Longitude ecl�ptica lunar para o pr�ximo signo
	double dLongLua = (( (int)( (sChartPos0.LongitEcliptica[ oMoo ] / 30.0 )+1 ) ) * 30.0 ) * PI/180.0; 
	
	// Determina a data em que a Lua vai ocupar esta longitude ecl�ptica
	CalcularRetorno( oMoo, dLongLua, dLat, dLon, dZona, dHoraVerao, &nDia, &nMes, &nAno, &dHora );

	CHora oH( dHora, FALSE ); // dHora no formato Hms

	CDiaJuliano oJDRet( nDia, nMes, nAno, oHora );

	return oJDRet.GetDiaJuliano();
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Dado o dia, mes, ano e hora do final do per�odo em que a Lua est� fora de curso, determina ( retrogradando o tempo )
// o in�cio deste per�odo
//
// Nota: O per�odo em que a Lua est� fora de curso(LFC) corresponde ao per�odo que vai desde o �ltimo aspecto que a Lua formou
//       quando estava num determinado signo at� a sua passagem para o signo seguinte.
//       Os Aspectos considerados s�o com o Sol e com os planetas: Merc�rio,Venus,Marte,Jupiter,Saturno,Urano,Netuno e Plut�o
//       Os aspectos considerados s�o as principais: Conjun��o,Oposi��o,Tr�gono,Sextil e Quadratura
//       A margem para o aspecto � de 1 minuto de arco. ( Ex: para quadratura 89 graus 59 minutos  e 30 segundos at� 90 graus 
//       00 minuto e 30 segundos), o que deve dar a precis�o de um minuto ( para mais e para menos ) na determina��o do per�odo. 
//       Como a posi��o da Lua tamb�m tem uma margem de erro de 1 minuto; a precis�o final na determina��o do per�odo deve ser 
//       de 2 minutos ( para mais e para menos )
//       Como este per�odo pode estar em qualquer tempo ( passado ou futuro ), o hor�rio de ver�o n�o ser� considerado, isto deve
//       ser feito na apresenta��o do resultado onde dever� ser indicado se est� ou n�o considerando o hor�rio de ver�o.
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
void CCalcMapa::CalculaInicioLuaForaDeCurso( int& nDia, int& nMes, int& nAno, double dLat, double dLon, double& dHoraMin, double dZona, double dHoraVerao )
{
	dHoraVerao = 0.0;

	int nDiaFinal = nDia;
	int nMesFinal = nMes;
	int nAnoFinal = nAno;
	double dHoraMinFinal = dHoraMin;

	CalcularMapa( nDiaFinal,nMesFinal, nAnoFinal, dLat, dLon, dHoraMinFinal, dZona, dHoraVerao );

	CHora oHora( dHoraMin, FALSE );

	// Em que signo a lua est� entrando
	CString oszCasaFinal = PlanetToCusp( sChartPos0.LongitEcliptica[oMoo] );

	CDiaJuliano oJD( nDia, nMes, nAno, oHora );

	double dDJ = oJD.GetDiaJuliano();

	double dDeltaT = -0.00069444445; // retrogradar 1 minuto de hora em fra��o do dia

	while( 1 )
	{
		dDJ += dDeltaT;

		double dHora;

		oJD.JulianoToDiaMesAno( dDJ, nDia, nMes, nAno, dHora );

		CHora oH( dHora, TRUE );

		int nHora = oH.GetHora();

		int nMin = oH.GetMinuto();

		double dSeg = oH.GetSegundo();

		if( dSeg >= 30.0 )
		{
			nMin++;

			if( nMin > 59 )
			{
				nHora++;
				nMin = 0;
			}
		}

		dHoraMin = nHora + (double)nMin/100.0;

		CalcularMapa(  nDia,nMes, nAno, dLat, dLon, dHoraMin, dZona, dHoraVerao );

		double dAngLua = sChartPos0.LongitEcliptica[oMoo]; 

		BOOL bTem = FALSE;

		for( int p = oSun; p < oChi; p++ )
		{
			if( p == oMoo )
			{
				continue;
			}

			double dDif = MinimaDistancia( dAngLua, sChartPos0.LongitEcliptica[p] );

			// Verifica se Lua forma algum aspecto com os demais planetas e o Sol
			// Considerando um erro( margem ) de 1 minuto, o que deve dar � lista a precis�o de mais ou menos 1 minuto

			if( ( dDif >= 359.9916667 || dDif <= 0.0083333 )   ||  // Se existe Conjun��o
				( dDif >= 59.9916667 && dDif <= 60.0083333 )   ||  // Se existe Sextil
				( dDif >= 89.9916667 && dDif <= 90.0083333 )   ||  // Se existe Quadratura
				( dDif >= 119.9916667 && dDif <= 120.0083333 ) ||  // Se existe Tr�gono
				( dDif >= 179.9916667 && dDif <= 180.0083333 ) )   // Se existe Oposi��o
			{
				bTem = TRUE;
				break;
			}
		}

		if( bTem )
		{
			break;
		}
	}
}

#endif


/*
	// Dados de entrada
	m_nDia = 3;
	m_nMes = 6;
	m_nAno = 1865;
	m_dLatitude  = 51.3000;		// 51:30:00N
	m_dLongitude = 0.1700;		// 0:17:00W
	m_dHora =  1.18000;			// 1:18Am
	m_dZonaTempo = 0.0;
	m_dHoraVerao = 0.0;
*/
void CCalcMapa::CalcularMapa( int nDia, int nMes, int nAno, double dLat, double dLon, double dHora, double dZona,
								double dHoraVerao, CArrayEntidades* paEntidades )
{
	BOOL bDetermineData = TRUE;
	int i = 0;

	m_nDia = nDia;
	m_nMes = nMes;
	m_nAno = nAno;

	m_dHoraVerao = HmsToDec( dHoraVerao );
	m_dZonaTempo = HmsToDec( dZona );

	m_dLatitude  = RADTODEG( dLat );	
	m_dLongitude = RADTODEG( dLon );
	m_dHora      = HmsToDec( dHora );

	// Tratamento do tempo de constru��o do mapa

	m_dHora += fabs( m_dHoraVerao );

	m_dHora = m_dHora - m_dZonaTempo;

	// Verifica validade da data

	if(!VerificaData() )
	{
		m_bCalcFs = FALSE;
	}

	// Abre arquivos de efem�rides
	if( !ma_bfRetorno || ma_bfRetorno && ma_bfLFC )
	{
		if( ( m_bFlagEfemerides = AbreEfemerides() ) == FALSE )
		{
			m_bCalcFs = FALSE;
		}
	}

	// In�cio dos c�lculos
	SetValoresIniciais();
	
	CalcularCasas( bDetermineData );			

	CalcularAstros();							// Calcular os planetas, aster�ides, Lua e seu Nodo 

	if( ma_bfRetorno || ma_bfLFC )
	{
		for( int i = 0; i <= cObj; i++ ) 
		{
			if( !nIgnorar[i] ) 
			{
				double dAscensaoReta = DEGTORAD( ToTropical( sChartPos0.LongitEcliptica[i] ) );

				double dDeclinacao = DEGTORAD( sChartPos0.LatitEcliptica[i] );

				TransformaCoordenadas( &dAscensaoReta, &dDeclinacao, DEGTORAD( AXIS ) );

				sChartPos0.AscensaoReta[i] = RADTODEG( dAscensaoReta );

				sChartPos0.Declinacao[i] = RADTODEG( dDeclinacao );
			}
		}

		if( ma_bfLFC && m_bFlagEfemerides )
		{
			FechaEfemerides();
		}

		return;
	}

	CalcularParteDaFortuna();

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Define o v�rtex, e o EP
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	sChartPos0.LongitEcliptica[oVtx] = m_dPosVertice; 

	sChartPos0.LongitEcliptica[oEP] = CuspideDoPontoEste();

	for( int i = 1; i <= cSign; i++ )
	{
		sChartPos0.LongitEcliptica[cuspLo + i - 1] = sChartPos0.cusp[i];
	}

	if( ! bfHouseAngle ) 
	{
		sChartPos0.LongitEcliptica[oAsc] = m_dAsc; 
		sChartPos0.LongitEcliptica[oMC] = m_dMC;
		sChartPos0.LongitEcliptica[oDes] = Mod( m_dAsc + DEGHALF );
		sChartPos0.LongitEcliptica[oNad] = Mod( m_dMC + DEGHALF );
	}

	for( i = oFor; i <= cuspHi; i++ )
	{
		sChartPos0.Velocidade[i] = DEGTORAD( DEGMAX );
	}

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Define a cauda do drag�o
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	sChartPos0.LongitEcliptica[ oCau ] = Mod( sChartPos0.LongitEcliptica[ oNod ] + 180. );
	sChartPos0.LatitEcliptica[ oCau ] = sChartPos0.LatitEcliptica[ oNod ];
	sChartPos0.Velocidade[ oCau ] = sChartPos0.Velocidade[ oNod ];

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Define a posi��o de Pr�apo
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	if( m_bCalcFs )
	{
		// Pr�apo � em fun��o de Black Moon ( Lilith )
		sChartPos0.LongitEcliptica[ oPri ] = Mod( sChartPos0.LongitEcliptica[ oLil ] + 180. );
		sChartPos0.LatitEcliptica[ oPri ] = sChartPos0.LatitEcliptica[ oLil ];
		sChartPos0.Velocidade[ oPri ] = sChartPos0.Velocidade[ oLil ];
	}

	if( ma_nHarmonicos > 1 )    // Mapa com harm�nicos?
	{
		for( i = 0; i <= cObj; i++ )
		{
			sChartPos0.LongitEcliptica[i] = Mod( sChartPos0.LongitEcliptica[i] * ( double )ma_nHarmonicos );
			//sChartPos0.LatitEcliptica[i] = 0.;
		}
	}
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Transforma as coordenadas ecl�pticas ( Latitude e Longitude ) para obter as 
	// equatoriais ( Ascens�o Reta e Declina��o
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	for( i = 0; i <= cObj; i++ ) 
	{
		if( !nIgnorar[i] ) 
		{
			double dAscensaoReta = DEGTORAD( ToTropical( sChartPos0.LongitEcliptica[i] ) );

			double dDeclinacao = DEGTORAD( sChartPos0.LatitEcliptica[i] );

			TransformaCoordenadas( &dAscensaoReta, &dDeclinacao, DEGTORAD( AXIS ) );

			sChartPos0.AscensaoReta[i] = RADTODEG( dAscensaoReta );

			sChartPos0.Declinacao[i] = RADTODEG( dDeclinacao );
		}
	}

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Modifica os valores b�sicos de acordo com os flags
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	// Arco solar ou mapa de progress�o? 
	if( bfProgressao && bfArcoSolar )   
	{
		for( i = 0; i <= cObj; i++ )
		{
			sChartPos0.LongitEcliptica[i] = Mod( sChartPos0.LongitEcliptica[i] + ( m_dJDProgress - m_dJD ) / m_dProgressDay );
		}

		for( i = 1; i <= cSign; i++ )
		{
			sChartPos0.cusp[i]  = Mod( sChartPos0.cusp[i]  + ( m_dJDProgress - m_dJD ) / m_dProgressDay );
		}
	}

	/*
	if( ma_nHarmonicos > 1 )    // Mapa com harm�nicos?
	{
		for( i = 0; i <= cObj; i++ )
		{
			sChartPos0.LongitEcliptica[i] = Mod( sChartPos0.LongitEcliptica[i] * ( double )ma_nHarmonicos );
		}
	}
	*/

	if( nObjOnAsc ) 
	{
		double dj;

		if( nObjOnAsc > 0 )          
		{
			 //  Objetos no ascendente?
			dj = sChartPos0.LongitEcliptica[nObjOnAsc] - m_dAsc;
		}
		else                           
		{
			// Objeto no Meio do C�u?
			dj = sChartPos0.LongitEcliptica[-nObjOnAsc] - m_dMC;
		}

		// Rotacionas os objetos de acordo 
		for( i = 1; i <= cSign; i++ )   
		{
			sChartPos0.cusp[i] = Mod( sChartPos0.cusp[i] + dj );
		}
	}

	// Verificar se algum objeto esta sendo for�ado a possuir algum valor em particular
	for( i = 0; i <= cObj; i++ )
	{
		if( m_adForca[i] != 0.0 ) 
		{
			sChartPos0.LongitEcliptica[i] = m_adForca[i] - DEGMAX;
			sChartPos0.LatitEcliptica[i] = sChartPos0.Velocidade[i] = 0.0;
		}
	}

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Calcula em que casa cada objeto cai
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	CalculaQuaisCasas();        

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Se vai executar deslocamento de posi��es
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	if( bfFlip) 
	{
		double  housetemp[cSign+1];

		for( i = 0; i <= cObj; i++ ) 
		{
			int k = sChartPos0.house[i];

			sChartPos0.house[i] = ComputaSdeZ( sChartPos0.LongitEcliptica[i] );

			sChartPos0.LongitEcliptica[i]   = ComputaZdeS( k ) + 
								  MinimaDistancia( sChartPos0.cusp[k], sChartPos0.LongitEcliptica[i] ) / 
				                  MinimaDistancia( sChartPos0.cusp[k], sChartPos0.cusp[Mod12( k+1 )] ) * 30.0;
		}

		for( i = 1; i <= cSign; i++ ) 
		{
			int k = QualCasa( ComputaZdeS( i ) );

			housetemp[i] = ComputaZdeS( k )+
				           MinimaDistancia( sChartPos0.cusp[k], ComputaZdeS( i ) ) / 
						   MinimaDistancia( sChartPos0.cusp[k], sChartPos0.cusp[Mod12( k+1 )] ) * 30.0;
		}

		for( i = 1; i <= cSign; i++ )
		{
			sChartPos0.cusp[i] = housetemp[i];
		}
	}

	// 
	if( bfDecan ) 
	{
		for( i = 0; i <= cObj; i++ )
		{
			sChartPos0.LongitEcliptica[i] = SignoDecano( sChartPos0.LongitEcliptica[i] );
		}

		CalculaQuaisCasas();
	}

	// Se mapa com navamsa
	if( bfNavamsa ) 
	{
		for( i = 0; i <= cObj; i++ )
		{
			sChartPos0.LongitEcliptica[i] = Navamsa( sChartPos0.LongitEcliptica[i] );
		}

		CalculaQuaisCasas();
	}

	//ListaTeste();

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// C�lculo do �ngulos das Linhas de divis�o entre os signos para o desenho do mapa
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	// The numeric state is complete before this legacy drawing adapter.
#if 0
	// sChartPos0.cusp[1] cont�m o �ngulo da c�spide da casa I contada a apartir de 0 graus de �ries
	double dShiftedRad = DEGTORAD( Mod( sChartPos0.cusp[1] + 180.0 ) );

	double dAnguloOrigem = Mod( sChartPos0.cusp[1] + 180.0 ) ;

	//TRACE( "\n\nC�lculo do Mapa\n\n" );

	for( i = aries ; i <= peixes; i++ )
	{
		//CString oszTest = RadToHms ( dShiftdRad );

		CSigno* pSigno = paEntidades->GetSigno( i );

		pSigno->SetAnguloPolar( dShiftedRad );
		pSigno->SetAnguloMapa ( dShiftedRad );

		double a1 = Fix( dShiftedRad  - TRINTA_GRAUS, 20 );
		double a2 = Fix( dShiftedRad, 20 );

		if( a2 <= a1 )
		{
			a2 += DPI;
		}
		else if( a1 >= a2 )
		{
			a1 -= DPI;
		}

		pSigno->SetAngulo1( a1 );
		pSigno->SetAngulo2( a2 );

		//TRACE( "%s - %.2lf %.2lf\n", pSigno->m_getNome(), pSigno->m_getAngulo1()*180./PI, pSigno->m_getAngulo2()*180./PI );

		//Para os signos seguintes
		//TRACE( "%s %s\n", pSigno->m_getNome(), RadToHms( dShiftedRad ));

		dShiftedRad  = DEGTORAD( Mod( RADTODEG( dShiftedRad ) - 30.0 ) );
	}

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// C�lculo dos �ngulos da c�spides para desenho
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	dShiftedRad = PI;

	i = 1;

	do
	{	
		CCasa* pCasa = paEntidades->ProcuraCasa( i );

		pCasa->SetAnguloMapa( dShiftedRad );

		//TRACE( "%d %s\n", pCasa->m_getNome(), RadToHms( dShiftedRad ) );

		pCasa->SetAnguloPolar( dShiftedRad );	

		pCasa->SetAngulo1( dShiftedRad );
		pCasa->SetAngulo2( dShiftedRad );

		if ( i == 12 ) 
		{
			break;
		}
		
		double dDif = fabs( Mod( sChartPos0.cusp[ i+1 ] - sChartPos0.cusp[ i ] ) );

		dShiftedRad = DEGTORAD ( Mod( RADTODEG( dShiftedRad ) - dDif ) );

		i++;

	} 
	while ( i < 13 );

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// C�lculo dos �ngulos dos objetos( Planeta, Lua, �nulos, etc.) para desenho
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	for( i=0; i < 31; i++ )
	{		
		CPlaneta* pPlaneta = paEntidades->ProcuraPlaneta( m_aoszObjetos.GetAt( i ) );

		if( pPlaneta != NULL )
		{
			double dShifted = DEGTORAD( Mod( dAnguloOrigem - sChartPos0.LongitEcliptica[i] ) );

			//TRACE( "%s %.2lf\n", pPlaneta->m_getNome(), sChartPos0.LongitEcliptica[i]);

			pPlaneta->SetAnguloMapa( dShifted );
			pPlaneta->SetAnguloPolar( dShifted ); 
			pPlaneta->SetAngulo1( dShifted );
			pPlaneta->SetAngulo2( dShifted );
			pPlaneta->SetAscensaoReta( DEGTORAD( sChartPos0.AscensaoReta[i] ) );
			pPlaneta->SetLongitude( DEGTORAD( sChartPos0.LongitEcliptica[i] ) );
			pPlaneta->SetLatitude( DEGTORAD( sChartPos0.LatitEcliptica[i] ) );
			pPlaneta->SetVelocidade( sChartPos0.Velocidade[i] );
			pPlaneta->SetDeclinacao( DEGTORAD( sChartPos0.Declinacao[i] ) );
		}
	}

	paEntidades->CalcularAspectos();
#endif

	// Fecha as efm�rides

	FechaEfemerides();
}


BOOL CCalcMapa::VerificaData()
{
	if( m_nAno < -5200 || m_nAno > 3225 )
	{
		AfxMessageBox( "Data fora do intervalo!\nEfem�ride v�lida para 01 de Janeiro de 5200 A.C at� 31 de Dezembro de 3225 D.C ");

		return FALSE;
	}

	return TRUE;
}


BOOL CCalcMapa::AbreEfemerides()
{
	//////////////////////////////////////////////////////////////////////////////////////////////
	// Abre todos os arquivos de efem�rides 
	//////////////////////////////////////////////////////////////////////////////////////////////
	if( !m_ExtEfem.Open("Externos.Efe", CFile::modeRead ) )
	{
		AfxMessageBox( "Erro na abertura de Externos.Efe");

		return FALSE;
	}

	if(! m_ChiEfem.Open("Chiron.Efe", CFile::modeRead ) )
	{
		AfxMessageBox( "Erro na abertura de Chiron.Efe");
		m_ExtEfem.Close();
		return FALSE;
	}

	if( !m_AstEfem.Open("Asteroides.Efe", CFile::modeRead ) )
	{
		AfxMessageBox( "Erro na abertura de Astroides.Efe");
		m_ExtEfem.Close();
		m_ChiEfem.Close();
		return FALSE;
	}

	return TRUE;
}


void CCalcMapa::FechaEfemerides()
{
	if( m_bFlagEfemerides )
	{
		m_AstEfem.Close();
		m_ExtEfem.Close();
		m_ChiEfem.Close();

		m_bFlagEfemerides = 0;
	}
}


void CCalcMapa::SetValoresIniciais()
{
	int i = 0;
	m_dJDProgress = 0.0;	
	m_dProgressDay =0.0;	
	m_dOffSetZodiacal = 0.0;	

	// Fazer os ajustes de acordo com as restri��es

	if( !bfCusp )
	{
		for( int i = cuspLo; i <= cuspHi; i++ )
		{
			nIgnorar[i] = nIgnorar2[i] = TRUE;
		}
	}

	if( !bfUraniano )
	{
		for( int i = uranLo; i <= uranHi; i++ )
		{
			nIgnorar[i] = nIgnorar2[i] = TRUE;
		}
	}

	for( int i = 0; i <= cObj; i++ ) 
	{
		sChartPos0.AscensaoReta[i] = sChartPos0.Declinacao[i] = 0.0;		// Coordenadas Equatoriais
		sChartPos0.LongitEcliptica[i] = sChartPos0.LatitEcliptica[i] = 0.0;	// Coordenadas Ecl�pticas
		sChartPos0.Velocidade[i] = 1.0;										// 1 Direto, -1 Retr�grado
	}

	for( i = 0; i <= cObj; i++ )
	{
		m_adForca[i] = 0.0;
	}

	for( i = 0; i <= cSign; i++ )
	{
		sChartPos0.cusp[i] = 0.0;
	}

	if( ma_bfRetorno )
	{
		for( int i = 0; i <= cObj; i++ ) 
		{
			//nIgnorar[i] = nIgnorar2[i] = !( i < oMer );

			if( i < oMer )
			{
				nIgnorar[i] = nIgnorar2[i] = FALSE;
			}
			else
			{
				nIgnorar[i] = nIgnorar2[i] = TRUE;
			}
		}
	}

	if( ma_bfLFC )
	{
		for( int i = 0; i <= cObj; i++ ) 
		{
			if( i < oChi )
			{
				nIgnorar[i] = nIgnorar2[i] = FALSE;
			}
			else
			{
				nIgnorar[i] = nIgnorar2[i] = TRUE;
			}
		}
	}
}

void CCalcMapa::CalcularCasas( BOOL bDetermineData )
{
	m_dLat = m_dLatitude;
	m_dLon = m_dLongitude;

	///////////////////////////////////////////////////////////
	m_dOffSet = ProcessaEntrada( bDetermineData );
	///////////////////////////////////////////////////////////

	///////////////////////////////////////////////////////////
	if( !ma_bfRetorno )
	{
		ComputarVariaveis();
		///////////////////////////////////////////////////////////

		// Se Geod�sico
		if( bfGeodesico )                 
		{
		  m_dRA = DEGTORAD( Mod ( -m_dLon ) );
		}

		////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		// C�lculo do ascendente e Meio do C�u
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		m_dMC  = CuspideDoMeioCeu();

		m_dAsc = CuspideDoAscendente();

		int nSistema = 8;	// Topoc�ntrico ( Fixo, nesta vers�o n�o tem como mudar )

		////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		// Calcular as c�spides das casas
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		ComputarCasas( nSistema );
	}
}


void CCalcMapa::CalcularAstros()
{	
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Computar posi��es dos Planetas
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	ComputarPlanetas();

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Computar posi��o da Lua
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	if( !nIgnorar[oMoo] || !nIgnorar[oNod] || !nIgnorar[oSou] || !nIgnorar[oFor] ) 
	{
		ComputarLua( &sChartPos0.LongitEcliptica[oMoo], &sChartPos0.LatitEcliptica[oMoo], &sChartPos0.LongitEcliptica[oNod], &sChartPos0.LatitEcliptica[oNod] );

		sChartPos0.Velocidade[oNod] = -1.0;
	}

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Certos Objetos necessitam ser calculadas com maior precis�o
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	if( m_bCalcFs )
	{
      ComputarPlanetasEfemerides( m_dEscTempo );
	}
	else
	{
      sChartPos0.LongitEcliptica[oSou] = Mod( sChartPos0.LongitEcliptica[oNod] + DEGHALF );
      sChartPos0.Velocidade[oSou] = sChartPos0.Velocidade[oNod] = DEGTORAD( -0.053 );
      sChartPos0.Velocidade[oMoo] = DEGTORAD( 12.5);
    }
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Computar posi��es dos Planetas, Sol, Lua, os 4 Aster�ides
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
void CCalcMapa::ComputarPlanetas()  
{
	double helioret[ oNorm+1 ];
	double heliox[oNorm+1];
	double helioy[oNorm+1];
	double helioz[oNorm+1];

	double dAber = 0.0, AU, E, EA, E1, M, XW, YW, AP, AN, INQ, X, Y, G, XS, YS, ZS;

	int index = oSun;
	int i;

	ELEMENTOS_ORBITAIS *pOrbElem; //OE *poe;

	while( index <= ( bfUraniano ? oNorm : cPlanet) )	// bfUraniano = FALSE e oNorm = uranHi = 40;
	{
		if( nIgnorar[index] && index > oSun )
		{
			index += ( index == oSun ? 2 : ( index != cPlanet ? 1 : uranLo-cPlanet ) );

			continue;
		}

		pOrbElem = &rgoe[ IndexOrbElemDoObjeto( index ) ];

		EA = M = ModRad( ValorToCoefQuad( pOrbElem->ma0, pOrbElem->ma1, pOrbElem->ma2 ) );

		E = RADTODEG( ValorToCoefQuad( pOrbElem->ec0, pOrbElem->ec1, pOrbElem->ec2) );

		for( i = 1; i <= 5; i++ )
		{
			// Solu��o da Equa��o de Kepler
			EA = M + E*sin( EA );            
		}

		AU = pOrbElem->sma;  // Semi-eixo maior

		E1 = 0.01720209/( pow( AU, 1.5 )*( 1.0-E*cos( EA ) ) );			// Inicializa coordenadas da velocidade

		XW = -AU*E1*sin( EA );											// Coordenadas perifocais

		YW = AU*E1*pow( 1.0-E*E,0.5)*cos( EA );

		AP = ValorToCoefQuad( pOrbElem->ap0, pOrbElem->ap1, pOrbElem->ap2 );

		AN = ValorToCoefQuad( pOrbElem->an0, pOrbElem->an1, pOrbElem->an2 );

		INQ = ValorToCoefQuad( pOrbElem->in0, pOrbElem->in1, pOrbElem->in2 ); // Inclina��o

		X = XW; 

		Y = YW;

		RectangularToSpherical2( AP, AN, INQ, &X, &Y, &G );							// Rotaciona coordenadas da velocidade

		heliox[index] = X; 

		helioy[index] = Y;

		helioz[index] = G;												// Coordenada H�lio ecliptica retangtular 

		X = AU*( cos( EA ) -E );										// Coordenadas perifocais a serem transformadas       

		Y = AU*sin( EA )*pow( 1.0- E*E,0.5 );							// para coordenadas retangulares

		RectangularToSpherical2( AP, AN, INQ, &X, &Y, &G );							// Rotaciona e transforma

		XS = X; 
		YS = Y; 
		ZS = G;             

		if( bEntreObjetos( index, oJup, oPlu ) )
		{
			CalculaCorrecaoErro( index, &XS, &YS, &ZS );
		}

		sChartPos0.Velocidade[index] = ( XS*helioy[index] - YS*heliox[index] ) / ( XS*XS + YS*YS ); /* Helio daily motion */

		m_adEspacial_x[index] = XS; 
		m_adEspacial_y[index] = YS; 
		m_adEspacial_z[index] = ZS;

		ProcessarPlanetas( index, 0.0 );

		index += ( index == oSun ? 2 : ( index != cPlanet ? 1 : uranLo-cPlanet ) );
	}

	m_adEspacial_x[oEar] = m_adEspacial_x[oSun];

	m_adEspacial_y[oEar] = m_adEspacial_y[oSun];

	m_adEspacial_z[oEar] = m_adEspacial_z[oSun];

	sChartPos0.LongitEcliptica[oEar] = sChartPos0.LongitEcliptica[oSun]; 

	sChartPos0.LatitEcliptica[oEar] = sChartPos0.LatitEcliptica[oSun];

	sChartPos0.Velocidade[oEar] = sChartPos0.Velocidade[oSun];

	heliox[oEar] = heliox[oSun]; 

	helioy[oEar] = helioy[oSun];

	m_adEspacial_x[oSun] = m_adEspacial_y[oSun] = m_adEspacial_z[oSun] = sChartPos0.LongitEcliptica[oSun] = sChartPos0.LatitEcliptica[oSun] = heliox[oSun] = helioy[oSun] = 0.0;

	if( ma_nObjetoCentral == oSun ) 
	{
		if( bfVelocidade )
		{
			// Utilizar velocidade relativa
			for( i = 0; i <= oNorm; i++ )   
			{
				sChartPos0.Velocidade[i] = DEGTORAD( 1.0 ); 
			}
		}
		return;
	}

	// Uma segunda passada � necess�rio para Mapa Geoc�ntricos ou com corpo central que n�o seja o Sol 
	// Por exemplo. n�o podemos achar a posi��o de Merc�rio em rela��o ao Plut�o at� que a posi��o de 
	// Plut�o em rela��o ao Sol seja conhecida, e como Merc�rio foi calculado antes, necessitamos de outra passada
	index = ma_nObjetoCentral;

	for( i = 0; i <= oNorm; i++ ) 
	{
		helioret[i] = sChartPos0.Velocidade[i];

		if( i != oMoo && i != index ) 
		{
			m_adEspacial_x[i] -= m_adEspacial_x[index];
			m_adEspacial_y[i] -= m_adEspacial_y[index];
			m_adEspacial_z[i] -= m_adEspacial_z[index];
		}
	}

	for( i = oEar; i <= ( bfUraniano ? oNorm : cPlanet); i += ( i == oSun ? 2 : ( i != cPlanet ? 1 : uranLo-cPlanet ) ) ) 
	{
		if( ( nIgnorar[i] && i > oSun ) || i == index )
		{
			continue;
		}

		XS = m_adEspacial_x[i]; 
		YS = m_adEspacial_y[i]; 
		ZS = m_adEspacial_z[i];
	
		sChartPos0.Velocidade[i] = ( XS * ( helioy[i] - helioy[index] ) - YS*( heliox[i] - heliox[index] ) ) / ( XS*XS+YS*YS );

		if( index == oEar)
		{
			// C�lculo da aberra��o
			dAber = 0.0057756* sqrt( XS*XS + YS*YS + ZS*ZS ) * RADTODEG( sChartPos0.Velocidade[i] ); 
		}

		ProcessarPlanetas( i, dAber );

		if( bfVelocidade )								
		{
			// Utilizar velocidade relativa
			sChartPos0.Velocidade[i] = DEGTORAD( sChartPos0.Velocidade[i]/helioret[i] ); 
		}
	}

	m_adEspacial_x[index] = m_adEspacial_y[index] = m_adEspacial_z[index] = 0.0;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Converte as coordenadas retangulares finais de um objeto ( planetas ) para 
// a posi��o zodiacal e declina��o
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
void CCalcMapa::ProcessarPlanetas( int index, double dAberracao )
{
	double  ang, rad;

	RectangularToPolar( m_adEspacial_x[index], m_adEspacial_y[index], &ang, &rad );

	sChartPos0.LongitEcliptica[index] = Mod( RADTODEG( ang) /*+ NU*/ - dAberracao + m_dOffSetGrauSideral );

	RectangularToPolar( rad, m_adEspacial_z[index], &ang, &rad );

	if( ma_nObjetoCentral == oSun && index == oSun )
	{
		ang = 0.0;
	}

	ang = RADTODEG( ang);

	while( ang > DEGQUAD )    // Assegura que delina��o est� entre -90..+90 degrees
	{
		ang -= DEGHALF;
	}

	while( ang < -DEGQUAD )
	{
		ang += DEGHALF;
	}

	sChartPos0.LatitEcliptica[index] = ang;
}

///////////////////////////////////////////////////////////////////////////////////////////////
// Calcula a posi��o e declina��o da Lua e nodo norte da Lua. 
///////////////////////////////////////////////////////////////////////////////////////////////
void CCalcMapa::ComputarLua( double* moonlo, double* moonla, double* nodelo, double* nodela )
{
	double LL, G, N, G1, D, L, ML, L1, MB, T1, Y, M = 3600.0, T2;

	T2 = m_dEscTempo*m_dEscTempo;

	LL = 973563.0+1732564379.0*m_dEscTempo-4.0*T2;	// Longitude lunar m�dia */

	G  = 1012395.0+6189.0*m_dEscTempo;				// Longitude m�dia do Sol no perigeu */

	N  = 933060.0-6962911.0*m_dEscTempo+7.5*T2;		// Nodo lunar m�edio */

	G1 = 1203586.0+14648523.0*m_dEscTempo-37.0*T2;	// Longitude m�dia do perigeu lunar */

	D  = 1262655.0+1602961611.0*m_dEscTempo-5.0*T2;	// Elonga��o m�dia da Lua a partir do Sol */

	L  = ( LL-G1 )/M;								// �ngulos auxiliares
	L1 = ( ( LL-D)-G)/M;				

	T1 = ( LL-N )/M; 
	D = D/M; 
	Y = 2.0*D;

	double dL  = DEGTORAD( L );
	double dL1 = DEGTORAD( L1 );
	double dT1 = DEGTORAD( T1 );
	double dD  = DEGTORAD( D );
	double dY  = DEGTORAD( Y );


	// C�lculo da perturba��es da Lua
	ML = 22639.6*sin( dL) - 4586.4*sin( dL-dY) + 2369.9*sin( dY) +
	     769.0*sin( 2.0*dL) - 669.0*sin( dL1) - 411.6*sin( 2.0*dT1) -
	     212.0*sin( 2.0*dL-dY) - 206.0*sin( dL+dL1-dY);

	ML += 192.0*sin( dL+dY) - 165.0*sin( dL1-dY) + 148.0*sin( dL-dL1) -
	      125.0*sin( dD) - 110.0*sin( dL+dL1) - 55.0*sin( 2.0*dT1-dY) -
	      45.0*sin( dL+2.0*dT1) + 40.0*sin( dL-2.0*dT1);

	*moonlo = G = Mod( ( LL+ML)/M+m_dOffSetGrauSideral);			// Longitude lunar

	// C�mputo da latitude lunar
	MB = 18461.5*sin( dT1) + 1010.0*sin( dL+dT1) - 999.0*sin( dT1-dL) -
	     624.0*sin( dT1-dY) + 199.0*sin( dT1+dY-dL) - 167.0*sin( dL+dT1-dY);

	MB += 117.0*sin( dT1+dY) + 62.0*sin( 2.0*dL+dT1) -
	      33.0*sin( dT1-dY-dL) - 32.0*sin( dT1-2.0*dL) - 30.0*sin( dL1+dT1-dY);

	*moonla = MB = Sinal( MB ) * ( ( fabs( MB)/M) / DEGMAX - floor( ( fabs( MB ) / M ) / DEGMAX ) ) * DEGMAX;

	// C�mputo do nodo lunar, Falso ou verdadeiro
	if( bfNodoVerdadeiro )
	{
		N = N+5392.0*sin( 2.0*dT1-dY)-541.0*sin( dL1)-442.0*sin( dY)+
		    423.0*sin( 2.0*dT1)-291.0*sin( 2.0*dL-2.0*dT1);
	}

	*nodelo = Mod( N/M+m_dOffSetGrauSideral);

	*nodela = 0.0;
}



///////////////////////////////////////////////////////////////////////////////////////////////
// Calcular a posi��o da Parte da Fortuna
///////////////////////////////////////////////////////////////////////////////////////////////
void CCalcMapa::CalcularParteDaFortuna()
{
	double dj = sChartPos0.LongitEcliptica[oMoo] - sChartPos0.LongitEcliptica[oSun];

/*
	if( nArabicNight < 0 || ( nArabicNight == 0 && QualCasa( sChartPos0.LongitEcliptica[oSun] ) < sLib) )
	{
		dj = -dj;
	}

	dj = fabs( dj) < DEGQUAD ? dj : dj - Sinal( dj)*DEGMAX;
*/

	sChartPos0.LongitEcliptica[oFor] = Mod( dj+m_dAsc );
}

///////////////////////////////////////////////////////////////////////////////////////////////
//
///////////////////////////////////////////////////////////////////////////////////////////////
double CCalcMapa::ProcessaEntrada( BOOL bDetermineData )
{
	double dSolMedio;				  // Sol m�dio
	double dNodoLunarMedio;
	
	//m_dHora = HmsToDec( m_dHora );
	
	//m_dLon = HmsToDec ( m_dLon );  // 00 

	//m_dLat = HmsToDec ( m_dLat );

	// Assegurar que  o mapa n�o esteja sendo feito exatamente( ? ) para os polos Norte e Sul
	
	m_dLat = min( m_dLat, 89.9999 );

	m_dLat = max( m_dLat, -89.9999 );

	m_dLat = DEGTORAD( m_dLat );

	if( bDetermineData ) 
	{
		m_dJD = ( double )DiaMesAnoToJuliano ( m_nDia, m_nMes, m_nAno );

		if( !bfProgressao || bfArcoSolar)
		{
			m_dEscTempo = ( m_dJD + m_dHora/24.0 - 2415020.5) / 36525.0;
		}
		else 
		{
			// Determina a data na qual o mapa progredido est� sendo calculado
			m_dEscTempo = ( ( m_dJD + m_dHora/24.0 + ( m_dJDProgress - ( m_dJD + m_dHora/24.0) ) / m_dProgressDay) - 2415020.5) / 36525.0;
		}
	}

	// C�lculo do valor da obliq�idade da ecl�ptica para o valor da escala de tempo( Data ) considerada
	m_dObliqEcliptica = DEGTORAD( 23.452294-0.0130125 * m_dEscTempo );

	dNodoLunarMedio = Mod( ( 933060-6962911*m_dEscTempo+7.5*m_dEscTempo*m_dEscTempo )/3600.0 );  // Nodo lunar m�dio

	dSolMedio = ( 259205536.0*m_dEscTempo+2013816.0)/3600.0;									// Sol m�dio

	dSolMedio = 17.23*sin( DEGTORAD( dNodoLunarMedio ) )+1.27*sin( DEGTORAD( dSolMedio) )-( 5025.64+1.11*m_dEscTempo)*m_dEscTempo;

	dSolMedio = ( dSolMedio-84038.27)/3600.0;

	m_dOffSetGrauSideral = ( bfSideral ? dSolMedio : 0.0 ) + m_dOffSetZodiacal;

	return dSolMedio;  // o offset angular
}

///////////////////////////////////////////////////////////////////////////////////////////////
// Calcula algumas vari�veis utilizadas na constru��o do mapa
///////////////////////////////////////////////////////////////////////////////////////////////
void CCalcMapa::ComputarVariaveis()
{
	double R, RA2, B, L, dObliq, G, X, Y, A;

	m_dRA = DEGTORAD( Mod( ( 6.6460656+2400.0513*m_dEscTempo+2.58E-5*m_dEscTempo*m_dEscTempo+m_dHora)*15.0-m_dLon ) );

	RA2 = m_dRA;
	dObliq = -m_dObliqEcliptica;
	B = m_dLat;
	A = RA2;
	R = 1.0;

	PolarToRectangular( A, R, &X, &Y );

	X *= cos( dObliq );

	RectangularToPolar( X, Y, &A, &R);

	m_dMC = Mod( m_dOffSetGrauSideral + RADTODEG( A ) );				// Meio do c�u

	if( bFlagFALSE )
	{
		L = RA2;

		G = RectangularToSpherical( B, L, dObliq );

		m_dAsc = Mod( m_dOffSetGrauSideral + Mod( G+PIHALF ) );			// Ascendente
	}

	L= RA2+PI;

	B = PIHALF - fabs( B );

	if( m_dLat < 0.0 )
	{
		B = -B;
	}

	G = RectangularToSpherical( B, L, dObliq);

	m_dPosVertice = Mod( m_dOffSetGrauSideral + RADTODEG( G + PIHALF ) );    /* Vertex */
}

///////////////////////////////////////////////////////////////////////////////////////////////
// C�spide do Meio do C�u
///////////////////////////////////////////////////////////////////////////////////////////////
double CCalcMapa::CuspideDoMeioCeu()
{
	double MC;

	MC = atan( tan( m_dRA )/cos( m_dObliqEcliptica ) );

	if( MC < 0.0 )
	{
		MC += PI;
	}

	if( m_dRA > PI )
	{
		MC += PI;
	}

	return Mod( RADTODEG( MC ) + m_dOffSetGrauSideral );
}


///////////////////////////////////////////////////////////////////////////////////////////////
// C�spide do Ascendente
///////////////////////////////////////////////////////////////////////////////////////////////
double CCalcMapa::CuspideDoAscendente()
{
	double Asc;

	Asc = CalculoAngulo( -sin( m_dRA )*cos( m_dObliqEcliptica )-tan( m_dLat)*sin( m_dObliqEcliptica ), cos( m_dRA ) );

	return Mod( RADTODEG( Asc ) + m_dOffSetGrauSideral );
}

///////////////////////////////////////////////////////////////////////////////////////////////
// C�spide do Ponto Este ( nome correto: Ascendente equatorial )
///////////////////////////////////////////////////////////////////////////////////////////////
double CCalcMapa::CuspideDoPontoEste()
{
	double EP = CalculoAngulo( -sin( m_dRA )*cos( m_dObliqEcliptica ), cos( m_dRA ) );

	return Mod( RADTODEG( EP ) + m_dOffSetGrauSideral );
}


///////////////////////////////////////////////////////////////////////////////////////////////
// Calcula a posi��o das c�spides de acorco com o sistema adotado
// Nesta vers�o somente a Topoc�ntrica � considerada
///////////////////////////////////////////////////////////////////////////////////////////////
void CCalcMapa::ComputarCasas( int nSistema )
{
	CString osz;

	if( fabs( m_dLat ) > DEGTORAD( 90.0-AXIS ) && nSistema < 2 ) 
	{
		osz.Format( "O sistema %s n�o foi definido para ser uilizadao em latitudes extremas", m_aoszSistema.GetAt( nSistema ) ); 

		AfxMessageBox( osz );

		m_dLat = dSinal2( m_dLat ) * DEGTORAD( 90.0-AXIS );
	}

	// Move o Ascendente se cair na metade inv�lida do zod�aco

	if( MinimaDiferenca( m_dMC, m_dAsc) < 0.0)
	{
		m_dAsc = Mod( m_dAsc + DEGHALF );
	}

	switch( nSistema ) 
	{
		case  1: HouseKoch();           break;
		case  2: HouseEqual();          break;
		case  3: HouseCampanus();       break;
		case  4: HouseMeridian();       break;
		case  5: HouseRegiomontanus();  break;
		case  6: HousePorphyry();       break;
		case  7: HouseMorinus();        break;
		case  8: CalculoCasaTopocentrico();    break;
		case  9: HouseAlcabitius();     break;
		case 10: HouseEqualMidheaven(); break;
		case 11: HousePorphyryNeo();    break;
		case 12: HouseWhole();          break;
		case 13: HouseVedic();          break;
		case 14: HouseNull();           break;
		default: HousePlacidus();
	}
}

void CCalcMapa::HouseKoch()
{
}

void CCalcMapa::HouseEqual()
{
}

void CCalcMapa::HouseCampanus()
{
}

void CCalcMapa::HouseMeridian()
{
}

void CCalcMapa::HouseRegiomontanus()
{
}

void CCalcMapa::HousePorphyry()
{
}

void CCalcMapa::HouseMorinus()
{
}

void CCalcMapa::HouseAlcabitius()
{
}

void CCalcMapa::HouseEqualMidheaven()
{
}

void CCalcMapa::HousePorphyryNeo()
{
}

void CCalcMapa::HouseWhole()
{
}

void CCalcMapa::HouseVedic()
{
}

void CCalcMapa::HouseNull()
{
}

void CCalcMapa::HousePlacidus()
{
}

///////////////////////////////////////////////////////////////////////////////////////////////
// C�lculo dos �ngulos das c�spides no sistema topoc�ntrico
///////////////////////////////////////////////////////////////////////////////////////////////
void CCalcMapa::CalculoCasaTopocentrico()
{
	sChartPos0.cusp[4] = ModRad( DEGTORAD( m_dMC + DEGHALF - m_dOffSetGrauSideral ) );

	double TL = tan( m_dLat ); 
	double P1 = atan( TL/3.0 ); 
	double P2 = atan( TL/1.5 ); 
	double dLTBack = m_dLat;

	m_dLat = P1; 
	sChartPos0.cusp[5] = CuspideTopocentrico( 30.0 ) + PI;

	m_dLat = P2; 
	sChartPos0.cusp[6] = CuspideTopocentrico( 60.0 ) + PI;

	m_dLat = dLTBack; 
	sChartPos0.cusp[1] = CuspideTopocentrico( 90.0 );
	
	m_dLat = P2; 
	sChartPos0.cusp[2] = CuspideTopocentrico( 120.0 );

	m_dLat = P1; 
	sChartPos0.cusp[3] = CuspideTopocentrico( 150.0 );
	
	m_dLat = dLTBack;

	for( int i = 1; i <= 6; i++ ) 
	{
		sChartPos0.cusp[i] = Mod( RADTODEG ( sChartPos0.cusp[i] ) + m_dOffSetGrauSideral );
		sChartPos0.cusp[i+6] = Mod( sChartPos0.cusp[ i ] + DEGHALF );
	}
}


///////////////////////////////////////////////////////////////////////////////////////////////
// Rotina auxilar de CalculoCasaTopocentrico()
///////////////////////////////////////////////////////////////////////////////////////////////
double CCalcMapa::CuspideTopocentrico( double dAngulo )
{
	double dOA = ModRad( m_dRA + DEGTORAD( dAngulo ) );

	double dX = atan( tan( m_dLat )/cos( dOA ) );

	double dLO = atan( cos( dX )*tan( dOA )/cos( dX + m_dObliqEcliptica ) );

	if( dLO < 0.0 )
	{
		dLO += PI;
	}

	if( sin( dOA ) < 0.0)
	{
		dLO += PI;
	}

	return dLO;
}


///////////////////////////////////////////////////////////////////////////////////////////////
// Determina a qual casa pertence cada objeto do mapa
///////////////////////////////////////////////////////////////////////////////////////////////
void CCalcMapa::CalculaQuaisCasas()
{
	for( int i = 0; i <= cObj; i++ )
	{
		sChartPos0.house[i] = QualCasa( sChartPos0.LongitEcliptica[i] );
	}
}

///////////////////////////////////////////////////////////////////////////////////////////////
// Dada uma posi��o zodial, retorna a casa em que cai.
///////////////////////////////////////////////////////////////////////////////////////////////
int CCalcMapa::QualCasa( double rDeg )
{
	int i = 0;

	rDeg = Mod( rDeg + 0.5/3600.0 );

	do 
	{
		i++;
	} while ( !( i >= cSign || ( rDeg >= sChartPos0.cusp[i] && rDeg < sChartPos0.cusp[Mod12( i+1)]) ||
	          ( sChartPos0.cusp[i] > sChartPos0.cusp[Mod12( i+1)] &&
	          ( rDeg >= sChartPos0.cusp[i] || rDeg < sChartPos0.cusp[Mod12( i+1)]) )) );

	return i;
}


///////////////////////////////////////////////////////////////////////////////////////////////
// Dado um �ngulo zodial, transforma-o em signi Decano., onde cada signo � trisecionado em tr�s
// signos de seu elemento. Por exemplo: 1 �ries -> 3 �ries, 10 Le�o -> 0 Sagit�rio, 25 
// Sagit�rio -> 15 Le�o
///////////////////////////////////////////////////////////////////////////////////////////////
double CCalcMapa::SignoDecano( double dDeg )
{
  int nSigno = ComputaSdeZ( dDeg );

  double unit = dDeg - ComputaZdeS( nSigno );

  nSigno = Mod12( nSigno + 4*( ( int)floor( unit/10.0 ) ) );

  unit = ( unit - floor( unit/10.0)*10.0)*3.0;

  return ComputaZdeS( nSigno ) + unit;
}

///////////////////////////////////////////////////////////////////////////////////////////////
// Dado uma posi��o zodiacal, transforma-o em equivalente Navamsa
///////////////////////////////////////////////////////////////////////////////////////////////
double CCalcMapa::Navamsa( double dDeg )
{
  int nSigno = ComputaSdeZ( dDeg );

  double unit = dDeg - ComputaZdeS( nSigno );

  int nSigno2 = Mod12( ( ( nSigno-1 & 3 )^( 2*( nSigno-1 & 1 ) ) )*3 + ( int )( unit*0.3 ) + 1 );

  return ComputaZdeS( nSigno2 )+unit;
}


///////////////////////////////////////////////////////////////////////////////////////////////
// Dado o dia, o m�s e o ano, converte no valor correspondente ao dia Juliano
// isto �, num n�mero de dias decorrido desde uma refer�ncia fixa
///////////////////////////////////////////////////////////////////////////////////////////////
long CCalcMapa::DiaMesAnoToJuliano( int dia, int mes, int ano )
{
	if( m_bCalcFs )
	{
		long im, j;

		im = 12*( ( long)ano+4800)+( long)mes-3;

		j = ( 2*( im%12) + 7 + 365*im)/12;

		j += ( long)dia + im/48 - 32083;

		if( j > 2299171)                  // Trata as datas no calend�rio Gregoriano
		{
			j += im/4800 - im/1200 + 38;     
		}

		return j;
	}
	else
	{
		int nfGreg = TRUE;

		if( ano < anoJ2G || ( ano == anoJ2G && ( mes < mesJ2G || ( mes == mesJ2G && dia < 15) )) )
		{
			nfGreg = FALSE;
		}

		double dDiasJuliano = DiasJulianosAbsolutos( dia, mes, ano, 12.0, nfGreg );

		return ( long)( floor( dDiasJuliano + 0.5 ) );
	}
}

// ReversoJuliano � o inverso de DiasJulianosAbsolutos()
// autor Original Mark Pottenger, Los Angeles.
// com bug fix para anos < -4711 16-aug-88 Alois Treindl
void CCalcMapa::ReversoJuliano( double jd, int gregflag, int* jdia, int *jmes, int* jano, double* jut )
{
	double u0, u1, u2, u3, u4;

	u0 = jd + 32082.5;

	if( gregflag ) 
	{
		u1 = u0 + floor( u0/36525.0 ) - floor ( u0/146100.0 ) - 38.0;

		if( jd >= 1830691.5 )
		{
			u1 +=1;
		}

		u0 = u0 + floor( u1/36525.0 ) - floor ( u1/146100.0 ) - 38.0;
	}

	u2 = floor( u0 + 123.0 );

	u3 = floor( ( u2 - 122.2 ) / 365.25 );

	u4 = floor( ( u2 - floor( 365.25 * u3 ) ) / 30.6001 );

	*jmes = (int)( u4-1.0 );

	if (*jmes > 12)
	{
		*jmes -= 12;
	}

	*jdia = (int)( u2 - floor( 365.25 * u3 ) - floor( 30.6001 * u4 ) );

	*jano = (int)( u3 + floor( ( u4 - 1.9999 ) / 12.0 ) - 4800.0 );

	*jut = ( jd - floor( jd + 0.5 ) + 0.5 ) * 24.0;
}

void CCalcMapa::JulianoToDiaMesAno( double dJD, int* dia, int* mes, int* ano )
{
	if(	m_bCalcFs )
	{
		long L, N, IT, JT, K, IK;

		L  = (long)floor( dJD+0.5 ) + 68569L;

		N  = DivisaoParaBaixo( 4L*L, 146097L );

		L  -= DivisaoParaBaixo( 146097L*N + 3L, 4L );

		IT = DivisaoParaBaixo( 4000L*(L+1L ), 1461001L );

		L  -= DivisaoParaBaixo( 1461L*IT, 4L ) - 31L;

		JT = DivisaoParaBaixo( 80L*L, 2447L );

		K  = L-DivisaoParaBaixo( 2447L*JT, 80L );

		L  = DivisaoParaBaixo( JT, 11L );

		JT += 2L - 12L*L;

		IK = 100L*( N-49L ) + IT + L;

		*mes = (int)JT; 
		*dia = (int)K; 
		*ano = (int)IK;
	}
	else
	{
		double dTempo;

		ReversoJuliano ( dJD, dJD >= 2299171.0 /* 15 de Outubro de 1582 */, dia, mes, ano, &dTempo );
	}
}


///////////////////////////////////////////////////////////////////////////////////////////////
// Esta rotina retorna o n�mero de dias Juliano Absolutos para uma data no calend�rio
// Se gregflag == 1 -> Assume-se que � o calend�rio Gregoriano
// Se gregflag == 0 -> Assume-se que � o calend�rio Juliano
// Obs: N�o confundir Dia Juliano com calend�rio Julinao ( nem � a mesma pessoa )
// Autor Original: Marc Pottenger, Los Angeles. com bug fix para abo < -4711   15-aug-88 por Alois Treindl

// The Julian day number is system of numbering all days continously within the time range of known human history. 
// It should be familiar for every astrological or astronomical programmer. The time variable in astronomical theories 
// is usually expressed in Julian days or Julian centuries ( 36525 days per century) relative to some start day; 
// the start day is called 'the epoch'.
// The Julian day number is a double representing the number of days since JD = 0.0 on 1 Jan -4712, 12:00 noon.
// Midnight has always a JD with fraction .5, because traditionally the astronomical day started at noon.
//
// NOTE: The Julian day number is named after the monk Julianus. It must not be confused with the Julian calendar system, which is named after
// Julius Cesar, the Roman politician who introduced this calendar. 
///////////////////////////////////////////////////////////////////////////////////////////////
double CCalcMapa::DiasJulianosAbsolutos( int dia, int mes, int ano, double hora, int gregflag)
{
	double jd, u, u0, u1, u2;

	u = ano;

	if( mes < 3)
	{
		u -=1;
	}

	u0 = u + 4712.0;

	u1 = mes + 1.0;

	if( u1 < 4)
	{
		u1 += 12.0;
	}

	jd = floor( u0*365.25) + floor( 30.6*u1+0.000001) + dia + hora/24.0 - 63.5;

	if( gregflag) 
	{
		u2 = floor( fabs( u) / 100) - floor( fabs( u) / 400);

		if( u < 0.0)
		{
			u2 = -u2;
		}

		jd = jd - u2 + 2;

		if( ( u < 0.0) && ( u/100 == floor( u/100) ) && ( u/400 != floor( u/400) ))
		{
			jd -= 1;
		}
	}

	return jd;
}


/////////////////////////////////////////////////////////////////////////////
// Converte hora no formato HH.MMSS para Decimal
/////////////////////////////////////////////////////////////////////////////
double CCalcMapa::HmsToDec( double dHms )
{
	double dSinal = Sinal( dHms ); 

	dHms = fabs( dHms );

	int nHora = ( int)( dHms + 0.0000001);

	double dMinSeg  = ( dHms - ( double)nHora )*100.0;

	int nMin = ( int)( dMinSeg+0.0000001);

	double dSeg  =  ( dMinSeg - ( double)nMin )*100.0;

	if( dSeg < 0.0000001 )
	{
		dSeg = 0.0;
	}

	return  dSinal * ( ( ( dSeg/60.0 + nMin ) / 60.0 ) + nHora );
}


CString CCalcMapa::RadToHms( double dRad ) 
{
	return ( DecToHms( RADTODEG ( dRad ) ) );
}

CString CCalcMapa::RadToHm( double dRad ) 
{
	return ( DecToHm( RADTODEG ( dRad ) ) );
}

CString CCalcMapa::DecToHms( double dDec ) 
{
	int nSinal = ( dDec < 0.0 ) ? -1 : 1;

	double dValor = fabs( dDec );

	int nGraus = (int)dValor;
	int nMinutos = (int)( ( dValor - (double)nGraus ) * 60.0 );

	dValor -= (double)nGraus + (double)nMinutos / 60.0;
	dValor *= 3600.0;

	// Os segundos contidos em dValor podem estar muito pr�ximos de 1 minuto.

	int nSegundos = (int)Fix( dValor, 0 );

	if( nSegundos >= 60 )
	{
		nMinutos += nSegundos / 60;
		nSegundos = nSegundos % 60;
	}

/*
	dValor += 0.0000000000001;

	// 60" � o mesmo que 1'.

	if( dValor == 60.0 )
	{
		nMinutos++;

		dValor = 0.0;
	}
*/
	// 60' � o mesmo que 1�.

	if( nMinutos >= 60 )
	{
		nGraus += nMinutos / 60;

		nMinutos = nMinutos % 60;
	}

	// 360� e 0� s�o a mesma coisa.

	CString oszVal, oszAux;

	oszAux.Format( "%3d %02d %02d", nGraus, nMinutos, nSegundos );

	if( nSinal < 0 )
	{
		oszVal = "-" + oszAux;
	}
	else
	{
		oszVal = oszAux;
	}

	return oszVal;
}


double CCalcMapa::DecToHora( double dDec ) 
{
	double dSinal = ( dDec < 0.0 ) ? -1.0 : 1.0;

	double dValor = fabs( dDec );

	int nHora = ( int) dValor;
	int nMinutos = ( int) ( ( dValor - ( double)nHora ) * 60 );

	dValor -= ( ( double)nHora + ( double)nMinutos / 60.0 );
	dValor *= 3600.0;

	// Os segundos contidos em dValor podem estar muito pr�ximos de 1 minuto.

	dValor += 0.0000000000001;

	// 60" � o mesmo que 1'.

	if( dValor == 60.0 )
	{
		nMinutos++;

		dValor = 0.0;
	}

	// 60' � o mesmo que 1�.

	if( nMinutos == 60.0 )
	{
		nHora++;

		nMinutos = 0;
	}

	double dHora = (double)nHora + (double)nMinutos / 100. + dValor/10000.;	

	return dHora * dSinal;
}


CString CCalcMapa::DecToHm( double dDec ) 
{
	int nSinal = ( dDec < 0.0 ) ? -1 : 1;

	double dValor = fabs( dDec );

	int nGraus = ( int) dValor;

	double dMin = ( dValor - ( double)nGraus)*60.0;

	CString oszMin;

	oszMin.Format( "%.0lf", dMin );

	int nMinutos = (int) atof( oszMin );

	// 60' � o mesmo que 1�.

	if( nMinutos == 60.0 )
	{
		nGraus++;

		nMinutos = 0;
	}

	// 360� e 0� s�o a mesma coisa.

	CString oszVal, oszAux;

	oszAux.Format( "%3d %02d", nGraus, nMinutos );

	if( nSinal < 0 )
	{
		oszVal = "-" + oszAux;
	}
	else
	{
		oszVal = oszAux;
	}

	return oszVal;
}

CString CCalcMapa::PlanetToCusp ( double dValor )
{
	int idx = 1;

	while ( dValor > 30 )
	{
		dValor -= 30.0;
		idx++;
	}

	CString oszSigno = m_aoszSignos.GetAt( idx - 1 );

	CString oszAng = DecToHm( dValor );

	return ( oszAng + "  " + oszSigno );
		
}

double CCalcMapa::Sinal( double dValor )
{
	double dSinal;
	
	if( dValor == 0.0 )
	{
		dSinal = 0.0;
	}
	else 
	{
		dSinal = dValor> 0.0 ? 1.0 : -1.0;
	}

	return dSinal;
}


int CCalcMapa::ComputaSdeZ( double dVal )	
{
	int nVal = ( int)( dVal );

	int nRet =  nVal/30 + 1;

	return nRet;
}


double CCalcMapa::ComputaZdeS( int nVal )
{
	double dRet  = ( ( double )nVal - 1.0 ) * 30.0;

	return dRet;
}


double CCalcMapa::ToTropical( double dDeg ) 
{
	return ( dDeg - m_dOffSetGrauSideral + m_dOffSetZodiacal );
}

///////////////////////////////////////////////////////////////////////////////////////////////
// Retorna a menor dist�ncia angular entre dois graus do zod�aco. Normalmente 
// � a diferen�a entre eles mas cuidados especiais devem ser tomados em posi��s
// pr�ximas a �ries
///////////////////////////////////////////////////////////////////////////////////////////////
double CCalcMapa::MinimaDistancia( double deg1, double deg2 )
{
	double dDif = fabs( deg1-deg2 );

	return dDif < DEGHALF ? dDif : DEGMAX - dDif;
}

///////////////////////////////////////////////////////////////////////////////////////////////
// Mesmo que a rotina MinimaDistancia() com diferen�a que esta rotina retorna valor positivo
// ou negativo dependendo da posi��o entre os dois graus
///////////////////////////////////////////////////////////////////////////////////////////////
double CCalcMapa::MinimaDiferenca( double deg1, double deg2 )
{
	double dDif = deg2 - deg1;

	if( fabs( dDif) < DEGHALF)
	{
		return dDif;
	}

	return Sinal( dDif )*( fabs( dDif ) - DEGMAX );
}

///////////////////////////////////////////////////////////////////////////////////////////////
// Dadas as coordenadas x e y, retorna o �ngulo formado pela linha que parte da origem
// at� estas coordenadas
///////////////////////////////////////////////////////////////////////////////////////////////
double CCalcMapa::CalculoAngulo( double dx, double dy)
{
	double da;

	if( dx != 0.0 ) 
	{
		if( dy != 0.0 )
		{
			da = atan( dy/dx );
		}
		else
		{
			da = dx < 0.0 ? PI : 0.0;
		}
	} 
	else
	{
		da = dy < 0.0 ? -PIHALF : PIHALF;
	}

	if( da < 0.0 )
	{
		da += PI;
	}

	if( dy < 0.0 )
	{
		da += PI;
	}

	return da;
}

///////////////////////////////////////////////////////////////////////////////////////////////
// Fun��o de m�dulo, normaliza o par�metro para intervalo 0 e 360 graus
///////////////////////////////////////////////////////////////////////////////////////////////
double CCalcMapa::Mod( double d )
{
	if( d >= 360.0 )        
	{
		d -= 360.0;
	}
	else if( d < 0.0 )
	{
		d += 360.0;
	}

	if( d >= 0 && d < 360.0)
	{
		return d;
	}

	return ( d - floor( d/360.0 )*360.0);
}

double CCalcMapa::Mod90( double d )
{
	if( d >= 90.0 )        
	{
		d -= 90.0;
	}
	else if( d < 0.0 )
	{
		d += 90.0;
	}

	if( d >= 0 && d < 90.0)
	{
		return d;
	}

	return ( d - floor( d/90.0 )*90.0);
}


///////////////////////////////////////////////////////////////////////////////////////////////
// Divis�o que arredonda para baixo
///////////////////////////////////////////////////////////////////////////////////////////////
long CCalcMapa::DivisaoParaBaixo( long x, long y )
{
	long z;

	if( y == 0 )
	{
		return x;
	}

	z = x / y;

	if( ( ( x >= 0 ) == ( y >= 0 ) ) || x - z*y == 0 )
	{
		return z;
	}

	return z - 1;
}

///////////////////////////////////////////////////////////////////////////////////////////////
// M�dulo para normaloizar entre 0 e 2 PIs radianos
///////////////////////////////////////////////////////////////////////////////////////////////
double CCalcMapa::ModRad( double r )
{
	while( r >= DPI )
	{
		r -= DPI;
	}

	while ( r < 0.0)
	{
		r += DPI;
	}

	return r;
}

///////////////////////////////////////////////////////////////////////////////////////////////
// M�dulo, normaliza inteiro entre 1 e 12
///////////////////////////////////////////////////////////////////////////////////////////////
int CCalcMapa::Mod12( int i )
{
	while( i > cSign )
	{
		i -= cSign;
	}

	while( i < 1 )
	{
		i += cSign;
	}

	return i;
}


void CCalcMapa::PolarToRectangular( double dA, double dR, double* dX, double* dY)
{
	if( dA == 0.0 )
	{
		dA = rSmall;
	}

	*dX = dR*cos( dA );

	*dY = dR*sin( dA );
}


void CCalcMapa::RectangularToPolar( double dX, double dY, double* dA, double* dR )
{
	if( dY == 0.0 )
	{
		dY = rSmall;
	}

	*dR = sqrt( dX * dX + dY * dY);

	*dA = CalculoAngulo( dX, dY );
}


double CCalcMapa::RectangularToSpherical( double dValB, double dValL, double dValO )
{
	double dR, dQ, dG, dX, dY, dA;

	dA = dValB; 
	dR = 1.0;

	PolarToRectangular( dA, dR, &dX, &dY );

	dQ = dY; 
	dR = dX; 
	dA = dValL;

	PolarToRectangular( dA, dR, &dX, &dY );

	dG = dX; 
	dX = dY; 
	dY = dQ;

	RectangularToPolar( dX, dY, &dA, &dR );

	dA += dValO;

	PolarToRectangular( dA, dR, &dX, &dY );

	dQ = asin( dY );

	dY = dX; 
	dX = dG;

	RectangularToPolar( dX, dY, &dA, &dR );

	if( dA < 0.0 )
	{
		dA += 2.0*PI;
	}

	dG = dA;

	return dG;  
}


void CCalcMapa::SphericalToRectangular( double dr, double dAzi, double dAlt, double* drx, double* dry, double* drz )
{
	double dAltRad = DEGTORAD( dAlt );
	double dAziRad = DEGTORAD( dAzi );

	*drz = dr  * sin( dAltRad );

	double drT = dr  * cos( dAltRad );

	*drx = drT * cos( dAziRad );

	*dry = drT * sin( dAziRad );
}


///////////////////////////////////////////////////////////////////////////////////////////////
// Dados tres valores, retorna os coeficientes de uma equa��o quadr�tica em 
// fun��o da escala de tempo
///////////////////////////////////////////////////////////////////////////////////////////////
double CCalcMapa::ValorToCoefQuad( double dr0, double dr1, double dr2 )
{
  return DEGTORAD( dr0 + dr1*m_dEscTempo + dr2*m_dEscTempo*m_dEscTempo );
}

///////////////////////////////////////////////////////////////////////////////////////////////
// Rotaciona as coordenadas retangulares segundo o �ngulo dada
///////////////////////////////////////////////////////////////////////////////////////////////
void CCalcMapa::RectangularToSpherical2( double dAP, double dAN, double dINQ, double* dX, double* dY, double* dG )
{
  double dR, dD, dA;

  RectangularToPolar( *dX, *dY, &dA, &dR ); 

  dA += dAP; 
  
  PolarToRectangular( dA, dR, dX, dY );

  dD  = *dX; 
  *dX = *dY; 
  *dY = 0.0; 
  
  RectangularToPolar( *dX, *dY, &dA, &dR );

  dA += dINQ; 
  
  PolarToRectangular ( dA, dR, dX, dY);

  *dG = *dY; 

  *dY = *dX; 

  *dX = dD; 

  RectangularToPolar( *dX, *dY, &dA, &dR ); 
  
  dA += dAN;

  if( dA < 0.0)
  {
    dA += 2.0*PI;
  }

  PolarToRectangular( dA, dR, dX, dY );

}

///////////////////////////////////////////////////////////////////////////////////////////////
// Dada a latitude e a longitude, retorna novos valores com as coordenadas inclinadas
// Efetua a Mudan�a de polo
///////////////////////////////////////////////////////////////////////////////////////////////
void CCalcMapa::TransformaCoordenadas( double* dAzi, double* dAlt, double dTilt)
{
	double dx, dy, da1, dl1;

	double sinalt  = sin( *dAlt ); 
	double cosalt  = cos( *dAlt ); 
	double sinazi  = sin( *dAzi );
	double sintilt = sin( dTilt ); 
	double costilt = cos( dTilt );

	dx = ( cosalt * sinazi * costilt ) - ( sinalt * sintilt );

	dy = cosalt * cos( *dAzi );

	dl1 = CalculoAngulo( dy, dx );

	da1 = cosalt * sinazi * sintilt + sinalt * costilt;

	da1 = asin( da1 );

	*dAzi = dl1; 

	*dAlt = da1;
}


///////////////////////////////////////////////////////////////////////////////////////////////
// Calcula valores harm�nicos para servir de fator de corre��o para os planetas 
// J�piter at� Plut�o, para melhorar a precis�o dos c�lculos
///////////////////////////////////////////////////////////////////////////////////////////////
void CCalcMapa::CalculaCorrecaoErro( int index, double* dx, double* dy, double* dz )
{
	double U, V, W, A, S0, T0[4];

	double *pr;

	int IK, IJ, irError;

	irError = rErrorCount[ index-oJup ];

	pr =  ( double* )( &rErrorData[ rErrorOffset[ index-oJup ] ] );

	for( IK = 1; IK <= 3; IK++ ) 
	{
		if( index == oJup && IK == 3 ) 
		{
			T0[3] = 0.0;
			break;
		}

		if( IK == 3 )
		{
			irError--;
		}

		S0 = ValorToCoefQuad( pr[0], pr[1], pr[2]); 

		pr += 3;

		A = 0.0;

		for( IJ = 1; IJ <= irError; IJ++ ) 
		{
			U = *pr++; 
			V = *pr++; 
			W = *pr++;
			A += DEGTORAD( U ) * cos( ( V*m_dEscTempo+W ) * PI/DEGHALF );
		}

		T0[IK] = RADTODEG( S0+A );
	}

	*dx += T0[2]; 
	*dy += T0[1]; 
	*dz += T0[3];
}


int CCalcMapa::IndexOrbElemDoObjeto( int obj )  
{
	int nIdx = ( obj < oMoo ? 0 : ( obj <= cPlanet ? obj-2 : obj-uranLo+cPlanet-1 ) );

	return nIdx;
}

/***********************************************************************************************************************/
/*	Rotinas para C�lculos com Efem�rides
/***********************************************************************************************************************/

///////////////////////////////////////////////////////////////////////////////////////////////
// Solu��o da equa��o de Kepler
// t   -> Anomalia m�dia em Graus
// ex  -> Excentricidade da �rbita
// err -> Erro m�ximo em graus
///////////////////////////////////////////////////////////////////////////////////////////////
double CCalcMapa::ResolveKepler( double dAnomaliaMedia, double dExcOrbita, double dErroMax )
{
	double dDelta = 1.0;

	dAnomaliaMedia *= fDEGTORAD;  // Em radianos

	dErroMax *= fDEGTORAD;		  // Em Radianos	

	double u0 = dAnomaliaMedia;

	while( fabs( dDelta ) >= dErroMax ) 
	{
		dDelta = ( dAnomaliaMedia + dExcOrbita * sin( u0 ) - u0 ) / ( 1 - dExcOrbita * cos( u0 ) );

		u0 += dDelta;
	}

	return u0;
}


///////////////////////////////////////////////////////////////////////////////////////////////
// Varia��es de M�dulo: Normaliza o �ngulo para o intervalo [0,360]
///////////////////////////////////////////////////////////////////////////////////////////////
double CCalcMapa::smod8360( double x )
{
	while ( x >= 360.0)
	{
		x -= 360.0;
	}

	while ( x < 0.0)
	{
		x += 360.0;
	}

	return x;
}

///////////////////////////////////////////////////////////////////////////////////////////////
// Varia��es de M�dulo: Normaliza o �ngulo para o intervalo [0,360]
///////////////////////////////////////////////////////////////////////////////////////////////
double CCalcMapa::mod8360( double x )
{
	if( x >= 0 && x < 360.0)
	{
		return x;
	}

	return ( x - 360.0 * floor( x / 360.0 ) );
}

///////////////////////////////////////////////////////////////////////////////////////////////
// Sendo a e b interno ao c�rculo de 360 graus, retorna no intervalo [-180, +180]
///////////////////////////////////////////////////////////////////////////////////////////////
double CCalcMapa::diff8360( double a, double b )
{
	double d = a - b;

	if( d >= 180.0)
	{
		return d - 360.0;
	}

	if( d < -180.0 )
	{
		return d + 360.0;
	}

	return d;
}

///////////////////////////////////////////////////////////////////////////////////////////////
// Faz teste de proximidade para valor zero
///////////////////////////////////////////////////////////////////////////////////////////////
double CCalcMapa::TesteProximidadeZero( double x )
{
	if( fabs( x ) >= NEAR_ZERO )
	{
		return x;
	}

	if( x < 0 )
	{
		return -NEAR_ZERO;
	}

	return NEAR_ZERO;
}

///////////////////////////////////////////////////////////////////////////////////////////////
// Computa as posi��es de Sol at� Plut�o, Quiron, os quatro aste�ides e os nodos ( m�dio ou verdadeiro )
// utiliando esta rotina. Outros objetos devem ser calculado separadamente
///////////////////////////////////////////////////////////////////////////////////////////////
void CCalcMapa::ComputarPlanetasEfemerides( double dEscTempo )
{
	int i;
	double  r1, r2, r3, r4;

	for( i = oSun; i <= oLil; i++ ) 
	{
		if( ( nIgnorar[i] && i > oMoo ) || ( bfPlacalcAst && bEntreObjetos( i, oCer, oVes ) ) )
		{
			continue;
		}

		if( ComputarPosicaoPlanetas( i, dEscTempo*36525.0+2415020.0, ma_nObjetoCentral != oEar, &r1, &r2, &r3, &r4 ) ) 
		{
			// Somente para corpo central sendo a Terra ou o Sol
			sChartPos0.LongitEcliptica[i] = Mod( r1 + m_dOffSetGrauSideral );

			sChartPos0.LatitEcliptica[i] = r2;

			sChartPos0.Velocidade[i] = DEGTORAD( r3 );

			//Calcula coordenadas x,y,z a partir do azimute, altitude e dist�ncia
			SphericalToRectangular ( r4, sChartPos0.LongitEcliptica[i], sChartPos0.LatitEcliptica[i], &m_adEspacial_x[i], &m_adEspacial_y[i], &m_adEspacial_z[i] );
		}
	}

	// Se for Helioc�ntrico, move objeto Terra para �ndice Zero
	i = ma_nObjetoCentral != oEar;

	if( i ) 
	{
		sChartPos0.LongitEcliptica[oEar] = sChartPos0.LongitEcliptica[oSun];

		sChartPos0.LatitEcliptica[oEar] = sChartPos0.LatitEcliptica[oSun];

		sChartPos0.Velocidade[oEar] = sChartPos0.Velocidade[oSun];

		m_adEspacial_x[oEar] = m_adEspacial_x[oSun];

		m_adEspacial_y[oEar] = m_adEspacial_y[oSun];

		m_adEspacial_z[oEar] = m_adEspacial_z[oSun];
	}

	m_adEspacial_x[i] = m_adEspacial_y[i] = m_adEspacial_z[i] = sChartPos0.LongitEcliptica[i] = sChartPos0.LatitEcliptica[i] = sChartPos0.Velocidade[i] = 0.0;

	if( ma_nObjetoCentral < oMoo )
	{
		return;
	}

	// Se outro corpo central, reposiciona todas posi��es
	for( i = 0; i <= oLil; i++ ) 
	{
		//#define bIgnore( i ) ( nIgnorar[i] || ( i) == ma_nObjetoCentral )
		//if( !bIgnore( i ) ) 
		if( nIgnorar[i] || i == ma_nObjetoCentral )
		{
			m_adEspacial_x[i] -= m_adEspacial_x[ma_nObjetoCentral];

			m_adEspacial_y[i] -= m_adEspacial_y[ma_nObjetoCentral];

			m_adEspacial_z[i] -= m_adEspacial_z[ma_nObjetoCentral];

			ProcessarPlanetas( i, 0.0 );
		}
	}

	m_adEspacial_x[ma_nObjetoCentral] = m_adEspacial_y[ ma_nObjetoCentral] = m_adEspacial_z[ma_nObjetoCentral] =

	sChartPos0.LongitEcliptica[ma_nObjetoCentral] = sChartPos0.LatitEcliptica[ma_nObjetoCentral] = sChartPos0.Velocidade[ma_nObjetoCentral] = 0.0;
}

/*
** ---------------------------------------------------------------
** | Copyright Astrodienst AG and Alois Treindl, 1989,1991,1993  |
** | The use of this source code is subject to regulations made  |
** | by Astrodienst Zurich. The code is NOT in the public domain.|
** |                                                             |
** | This copyright notice must not be changed or removed        |
** | by any user of this program.                                |
** ---------------------------------------------------------------
**
** Important changes:
** 11-jun-93 revision 1.12: fixed error which affected Mercury between -2100
** and -3100 ( it jumped wildly).
*/

// Dado o �ndice de um objeto, o Dia Juliano, calcula a posi��o e a declina��o zodiacal
// ( Latitude e Longitude planet�ria ), sua velocidade e dist�ncia a aprtir da Terra ou Sol
BOOL CCalcMapa::ComputarPosicaoPlanetas( int ind, double jd, int helio, double* obj, double* objalt, double* dir, double* space )
{
	int iobj, flag;

	double jd_ad, rlng, rrad, rlat, rspeed;

	if( ind <= oPlu )      // Convers�o de �ndices
	{
		iobj = ind-1;
	}
	else if( ind == oChi )
	{
		iobj = CHIRON;
	}
	else if( bEntreObjetos( ind, oCer, oVes ) )
	{
		iobj = ind - oCer + DEMETER;
	}
	else if( ind == oNod )
	{
		iobj = bfNodoVerdadeiro ? TRUE_NODE : MEAN_NODE;
	}
	else if( ind == oLil )
	{
		iobj = LILITH;
	}
	else
	{
		return FALSE;
	}

	jd_ad = jd - JUL_OFFSET;

	flag = helio ? CALC_BIT_SPEED | CALC_BIT_HELIO : CALC_BIT_SPEED;

	jd_ad += LeDiferencTempo( jd_ad );

	if( CalculoPrincipal( iobj, jd_ad, flag, &rlng, &rrad, &rlat, &rspeed ) ) 
	{
		*obj    = rlng;

		*objalt = rlat;

		*dir    = rspeed;

		*space  = rrad;

		return TRUE;
	}

	return FALSE;
}

/*
---------------------------------------------------------------
| Copyright Astrodienst Zurich AG and Alois Treindl, 1989.    |
| The use of this source code is subject to regulations made  |
| by Astrodienst Zurich. The code is NOT in the public domain.|
|                                                             |
| This copyright notice must not be changed or removed        |
| by any user of this program.                                |
---------------------------------------------------------------
*/

double CCalcMapa::LeDiferencTempo( double jd_ad )
{
	static short int dt[] =  /* in centiseconds */
	{
		// delta tempo de 1637 at� 2000, como tabulado no AE. Os valores entre 1629-1636 n�o foi tomado porque 
		// se ajustam muito mal � par�bola 25,5t*t para o pr�ximo intervalo.
		// O melhor ponto de cruzamento para trocar de par�bola � 1637, onde os valore foram ajustados para a
		// continuidade
		6780, 6500, 6300,
		6200, 6000, 5800, 5700, 5500,
		5400, 5300, 5100, 5000, 4900,
		4800, 4700, 4600, 4500, 4400,
		4300, 4200, 4100, 4000, 3800, /* 1655 - 59 */
		3700, 3600, 3500, 3400, 3300,
		3200, 3100, 3000, 2800, 2700,
		2600, 2500, 2400, 2300, 2200,
		2100, 2000, 1900, 1800, 1700,
		1600, 1500, 1400, 1400, 1300,
		1200, 1200, 1100, 1100, 1000,
		1000, 1000, 900,  900,  900,
		900,  900,  900,  900,  900,
		900,  900,  900,  900,  900,  /* 1700 - 1704 */
		900,  900,  900,  1000, 1000,
		1000, 1000, 1000, 1000, 1000,
		1000, 1000, 1100, 1100, 1100,
		1100, 1100, 1100, 1100, 1100,
		1100, 1100, 1100, 1100, 1100,
		1100, 1100, 1100, 1100, 1200, /* 1730 - 1734 */
		1200, 1200, 1200, 1200, 1200,
		1200, 1200, 1200, 1200, 1300,
		1300, 1300, 1300, 1300, 1300,
		1300, 1400, 1400, 1400, 1400,
		1400, 1400, 1400, 1500, 1500,
		1500, 1500, 1500, 1500, 1500, /* 1760 - 1764 */
		1600, 1600, 1600, 1600, 1600,
		1600, 1600, 1600, 1600, 1600,
		1700, 1700, 1700, 1700, 1700,
		1700, 1700, 1700, 1700, 1700,
		1700, 1700, 1700, 1700, 1700,
		1700, 1700, 1600, 1600, 1600, /* 1790 - 1794 */
		1600, 1500, 1500, 1400, 1400,
		1370, 1340, 1310, 1290, 1270, /* 1800 - 1804 */
		1260, 1250, 1250, 1250, 1250,
		1250, 1250, 1250, 1250, 1250,
		1250, 1250, 1240, 1230, 1220,
		1200, 1170, 1140, 1110, 1060,
		1020, 960,  910,  860,  800,
		750,  700,  660,  630,  600,  /* 1830 - 1834 */
		580,  570,  560,  560,  560,
		570,  580,  590,  610,  620,
		630,  650,  660,  680,  690,
		710,  720,  730,  740,  750,
		760,  770,  770,  780,  780,
		788,  782,  754,  697,  640,  /* 1860 - 1864 */
		602,  541,  410,  292,  182,
		161,  10, -102, -128, -269,
		-324, -364, -454, -471, -511,
		-540, -542, -520, -546, -546,
		-579, -563, -564, -580, -566,
		-587, -601, -619, -664, -644, /* 1890 - 1894 */
		-647, -609, -576, -466, -374,
		-272, -154, -2, 124,  264,
		386,  537,  614,  775,  913,
		1046, 1153, 1336, 1465, 1601,
		1720, 1824, 1906, 2025, 2095,
		2116, 2225, 2241, 2303, 2349, /* 1920 - 1924 */
		2362, 2386, 2449, 2434, 2408,
		2402, 2400, 2387, 2395, 2386,
		2393, 2373, 2392, 2396, 2402,
		2433, 2483, 2530, 2570, 2624,
		2677, 2728, 2778, 2825, 2871,
		2915, 2957, 2997, 3036, 3072, /* 1950 - 1954 */
		3107, 3135, 3168, 3218, 3268,
		3315, 3359, 3400, 3447, 3503,
		3573, 3654, 3743, 3829, 3920,
		4018, 4117, 4223, 4337, 4449,
		4548, 4646, 4752, 4853, 4959,
		5054, 5138, 5217, 5296, 5379, // 1980 - 1984 
		5434, 5487, 5532, 5582, 5630, // 1985 - 89 a partir da AE 1991 
		5686, 5757, 5900, 5900, 6000, // AE 1993 e extraplo��o 
		6050, 6100, 6150, 6200, 6250, // 1995 - 1999 
		6300						  // 2000 
	};

	double yr, cy, delta;

	long iyr, i;

	yr = ( jd_ad + 18262 ) / 365.25 + 100.0;    //  Ano relativo: 1800 

	cy = yr / 100;

	iyr =  (long)( floor(yr ) + 1800);			// Truncado para inteiro, rel 0 

#if TIDAL_26									// F�rmula de Stephenson somente para 26" de termo da mar� no movimento lunar
												   
	if( iyr >= 1637  && iyr < 2000 ) 
	{
		i = iyr - 1637;
		delta = dt[i] * 0.01 + (dt[i+1] - dt[i]) * (yr - floor(yr)) * 0.01;
	} 
	else if( iyr >= 2000 ) 
	{ 
		// par�bola, ajustado no valor[2000] 
		delta = 25.5 * cy * cy  - 25.5 * 4 + 63.00;
	} 
	else if( iyr >= 948 ) 
	{  
		// de 948 - 1637 utilizar par�bola
		delta = 25.5 * cy * cy;
	} 
	else 
	{  
		//anterior a 984 utilizar outra par�bola 
		delta = 1361.7  + 320 * cy + 44.3 * cy * cy;  // Ajusta em 948 
	}
#else    
	// utilizar valor de Clemence + 5 segundos para antes de 1690, novo dt depois disso
	cy -= 1;  // �poca 1900

	if( iyr >= 1690  && iyr < 2000 ) 
	{
		i = iyr - 1637;
		delta = dt[i] * 0.01 + ( dt[i+1] - dt[i] ) * ( yr - floor( yr ) ) * 0.01;
	} 
	else if( iyr >= 2000 ) 
	{ 
		// par�bola, ajustada no valor[2000] 
		delta = 29.949 * cy * cy  - 29.949 * 4 + 63.0;
	} 
	else 
	{
		delta = 5 + 24.349 + 72.3165 * cy + 29.949 * cy * cy; // Ajusta em 1690
	}
#endif

	return delta / 86400.0;

}


/*
** ---------------------------------------------------------------
** | Copyright Astrodienst AG and Alois Treindl, 1989,1991,1993  |
** | The use of this source code is subject to regulations made  |
** | by Astrodienst Zurich. The code is NOT in the public domain.|
** |                                                             |
** | This copyright notice must not be changed or removed        |
** | by any user of this program.                                |
** ---------------------------------------------------------------
**/

// nPlaneta			�ndice do planetas definida em Defines.h
//					nPlanetq == -1 calcula somente nut e ecl 
// dJDEfem;         Dia Juliano relativo � efem�ride
// nFlag;			Flags 
// *pdLong			Longitude el�ptica em graus
// *pdRaio			Raio em U.A,
// *pdLat =			La=titude ecl�ptica em graus
// *pdVeloc			Velocidade em graus de longitude por dia
BOOL CCalcMapa::CalculoPrincipal( int nPlaneta, double dJDEfem, int nFlag, double* pdLong, double* pdRaio, double* pdLat, double* pdVeloc )
{
	// Tempo para os quais os dados est�o sendo calculados
	struct sDataAtual  
	{
		double calculation_time, lng, rad, zet, lngspeed, radspeed, zetspeed;
	};

	static struct sDataAtual terraData = { HUGE8, HUGE8, HUGE8, HUGE8, HUGE8, HUGE8, HUGE8 };
	static struct sDataAtual luaData   = { HUGE8, HUGE8, HUGE8, HUGE8, HUGE8, HUGE8, HUGE8 };

	double  c, s, x, knn, knv;
	double  rp, zp;				
	double  *azet = pdLat;

	BOOL bCalcGeo, calc_helio, calc_apparent, calc_speed, calc_nut;

	// PosHeliocentricaUp() verifica se as rotinas j� foram chamadas para a mesma data

	PosHeliocentricaUp( dJDEfem );

	calc_helio =  nFlag & CALC_BIT_HELIO;
	bCalcGeo = ! calc_helio;
	calc_apparent = ! ( nFlag & CALC_BIT_NOAPP );
	calc_nut = ! ( nFlag & CALC_BIT_NONUT );
	calc_speed = nFlag & CALC_BIT_SPEED;
	
	// Computa��o da Terra necess�ria se:
	// Lua ou Terra helioc�ntrias
	// Qualquer planeta no geoc�ntrico exceto Lua e Lilith
	if( calc_helio && ( nPlaneta == MOON || nPlaneta == EARTH ) || 
	    bCalcGeo && nPlaneta != MOON && 
	    nPlaneta != MEAN_NODE && 
	    nPlaneta != TRUE_NODE && 
	    nPlaneta != LILITH) 
	{
		if( terraData.calculation_time != dJDEfem ) 
		{
			PosHeliocentrica( EARTH, dJDEfem, pdLong, pdRaio, azet, pdVeloc, &rp, &zp );

			// Guarda os dados
			terraData.lng = *pdLong;
			terraData.rad = *pdRaio;
			terraData.zet = *azet;
			terraData.lngspeed = *pdVeloc;
			terraData.radspeed = rp;
			terraData.zetspeed = zp;
			terraData.calculation_time = dJDEfem;
		}
	}

	switch( nPlaneta) 
	{
		case EARTH: // J� computado
		{
			*pdLong = terraData.lng;
			*pdRaio = terraData.rad;
			*azet = terraData.zet;
			*pdVeloc = terraData.lngspeed;
			rp = terraData.radspeed;
			zp = terraData.zetspeed;

			if( bCalcGeo )	// Sol vista da Terra
			{ 
				*pdLong = smod8360( *pdLong + 180.0);
				*azet = - *azet;
			}

			if( calc_apparent )
			{
				*pdLong = *pdLong - 0.0057683 * ( *pdRaio) * ( *pdVeloc);
			}

			break;
		}

		case MOON:
		{
			CalculoObjetoLua( pdLong, pdRaio, azet );
			luaData.lng = *pdLong;		// luaData ser� utilizada se TRUE_NODE 
			luaData.rad = *pdRaio;
			luaData.zet = *azet;
			*pdVeloc = 12;
			luaData.calculation_time = dJDEfem;

			if( calc_helio || calc_speed )		
			{	
				double lng2, radi2, zet2;

				PosHeliocentricaUp( dJDEfem + MOON_SPEED_INTERVAL);
				CalculoObjetoLua( &lng2, &radi2, &zet2);
				PosHeliocentricaUp( dJDEfem);

				if( calc_helio )  // Lua vista do Sol
				{
					HelioToGeocentrico( terraData.lng, -terraData.rad, luaData.lng, luaData.rad, luaData.zet, pdLong, pdRaio );
					HelioToGeocentrico( terraData.lng + MOON_SPEED_INTERVAL * terraData.lngspeed,
						                -( terraData.rad + MOON_SPEED_INTERVAL * terraData.radspeed ),
					                    lng2, radi2, zet2, &lng2, &radi2);
				}

				*pdVeloc =  diff8360( lng2, *pdLong ) / MOON_SPEED_INTERVAL;

				// rp = ( rad2 - *pdRaio) / MOON_SPEED_INTERVAL;       
				// zp = ( zet2 - luaData.zet) / MOON_SPEED_INTERVAL; 
			}

			*pdLat = fRADTODEG * asin( *azet / *pdRaio );

			// Corre��o de velocidade da luz n�o aplicada a Lua e seus nodos
			// Em torno de 0.02" segundos de arco
			break;
		}

		case MERCURY:
		case VENUS:
		case MARS:
		case JUPITER:
		case SATURN:
		case URANUS:
		case NEPTUNE:
		case PLUTO:
		case CHIRON:
		case DEMETER:
		case PALLAS:
		case JUNO:
		case VESTA:
		{
			if( !PosHeliocentrica( nPlaneta, dJDEfem, pdLong, pdRaio, azet, pdVeloc, &rp, &zp ) )
			{
				return FALSE; 
			}

			if( bCalcGeo )        // Geoc�ntrico
			{
				double lng1, radi1, lng2, radi2;

				HelioToGeocentrico( terraData.lng, terraData.rad, *pdLong, *pdRaio, *azet, &lng1, &radi1 );
				HelioToGeocentrico( terraData.lng + terraData.lngspeed,
				                    terraData.rad + terraData.radspeed,
				                    *pdLong + *pdVeloc, *pdRaio + rp, *azet + zp, &lng2, &radi2 );
				*pdLong = lng1;
				*pdRaio = radi1;
				*pdVeloc = diff8360( lng2, lng1 );
			}

			*pdLat = fRADTODEG * asin( *azet / *pdRaio );

			if( calc_apparent )
			{
				*pdLong = *pdLong - 0.0057683 * ( *pdRaio ) * ( *pdVeloc );
			}

			break;
		}

		case MEAN_NODE:
		{
			*pdLong = smod8360( m_arrayEle[MOON].kn );

			// A dist�ncia do nodo � o par�metro orbital p = a ( 1-e^2);
			// A utiliza��o do eixo como est� sendo feita aqui n�o � correto, mas nunca � utilizada
			*pdRaio = pd[MOON].axis;
			*pdLat = 0.0;
			*pdVeloc = -0.053;
			break;
		}

		case TRUE_NODE: 
		{
			double ln, rn, zn,
			lv, rv, zv,
			l1, r1, z1,
			xn, yn, xv, yv, r0, x0, y0;

			PosHeliocentricaUp( dJDEfem + NODE_INTERVAL );
			CalculoObjetoLua( &ln, &rn, &zn );
			PosHeliocentricaUp( dJDEfem - NODE_INTERVAL );
			CalculoObjetoLua( &lv, &rv, &zv );
			PosHeliocentricaUp( dJDEfem );

			if( luaData.calculation_time != dJDEfem )
			{
				CalculoObjetoLua( &l1, &r1, &z1 );
			}
			else 
			{  
				// Lua j� calculada
				l1 = luaData.lng;
				r1 = luaData.rad;
				z1 = luaData.zet;
			}

			rn = sqrt( rn * rn - zn * zn );
			rv = sqrt( rv * rv - zv * zv );
			r0 = sqrt( r1 * r1 - z1 * z1 );
			xn = rn * cos( fDEGTORAD * ln );
			yn = rn * sin( fDEGTORAD * ln );
			xv = rv * cos( fDEGTORAD * lv );
			yv = rv * sin( fDEGTORAD * lv );
			x0 = r0 * cos( fDEGTORAD * l1 );
			y0 = r0 * sin( fDEGTORAD * l1 );
			x = TesteProximidadeZero( x0 * yn - xn * y0 );
			s = ( y0 * zn - z1 * yn ) / x;
			c = TesteProximidadeZero( ( x0 * zn - z1 * xn ) / x );
			knn =  smod8360( fRADTODEG * atan2( s, c ) ); 
			x = TesteProximidadeZero( y0 * xv - x0 * yv );
			s = ( yv * z1 - zv * y0 ) / x;
			c = TesteProximidadeZero( ( xv * z1 - zv * x0 ) / x );
			knv =  smod8360( fRADTODEG * atan2( s, c ) );
			*pdLong = smod8360( ( knv + knn ) / 2 );

			// Veja coment�rio sobre a dist�ncia dos nodos
			*pdRaio = pd[MOON].axis;
			*pdLat = 0.0;
			*pdVeloc = diff8360( knn, knv ) / NODE_INTERVAL;
			break;
		}

		case LILITH: 
		{
			// Lilith ou Lua Negra ( dark Moon ) � ponto focal ( vazio ) da elipse lunar m�dia
			// e eta a 180 graus do peri�lio.
			// Como a �rbita lunar n�o se encontra na ecl�ptica, � necess�rio projet�-la sobre a ecl�ptica
			// do mesmo modo como s�o feitas para as �rbitas planet�rias 

			// O c�mputo aqui � Lilith M�DIO e n�o a verdadeira que poderia ser derivada de forma similar ao 
			// do Nodo Verdadeiro
			// Para o vetor raio de Lilith utiliza-se a f�rmula simples:
			// Para maior precis�o teria de ser levado em conta que o ponto focal da el�pse n�o est�
			// no centro da Terra mas sim no baricentro das posi��es da Terra e Lua
			// Para a velocidade ser� utilizada sempre a constante T do termo do peri�lio lunar
			double arg_lat, lon, cosi;

			ELEMENTOS *e = &m_arrayEle[MOON];

			arg_lat = NormalizaDeg( e->pe - e->kn + 180.0 );
			cosi = cos( fDEGTORAD*(e->in) );

			if( e->in == 0 || fabs( arg_lat -  90.0 ) < TANERRLIMIT	|| fabs( arg_lat - 270.0 ) < TANERRLIMIT ) 
			{
				lon = arg_lat;
			} 
			else 
			{
				lon = atan( tan( fDEGTORAD*(arg_lat) ) * cosi );
				lon = fRADTODEG * lon;

				if( arg_lat > 90.0 && arg_lat < 270.0 )  
				{
					lon += 180.0;
				}
			}

			lon = NormalizaDeg( lon + e->kn );

			*pdLong = lon;
			*pdVeloc = 0.111404;  // 6'41.05" por dia
			*pdRaio = 2 * pd[MOON].axis * e->ex;

			// Para testar o erro Gravalaines, retornar a longitude n�o projetada em  pdLat.
			// A latitude correta poderia ser :
			/// *pdLat = fRADTODEG * ASIN8( SINDEG( arg_lat) * SINDEG( e->in)); */
			//
			//#ifdef ASTROLOG
			//*pdLat = fRADTODEG * ASIN8( SINDEG( arg_lat) * SINDEG( e->in));
			//#else
			//*pdLat = NormalizaDeg( arg_lat + e->kn); // longitude n�o projetada, sem nuta��o
			//#endif
			
			*pdLat = fRADTODEG * asin( sin( fDEGTORAD*arg_lat ) * sin( fDEGTORAD*e->in ) );
			break;
		}
		
		default:
		{
			return FALSE;
		}
  } 

  if( calc_nut )
  {
    *pdLong += m_dNutacao;
  }

  *pdLong = smod8360( *pdLong );  

  return TRUE;
}


//
// PosHeliocentricaUp()
// Prepara os elementos de �rbita e as perturba��es para os planetas interno e a Lua
// PosHeliocentricaUp( t) � chamada por PosHeliocentrica() e pelo CalculoPrincipal().
// Esta rotina retorna o seu resultado em vari�veis globais
// e grava a data para a qual foi calculada de modo que n�o � chamada duas vezes para a mesma data
void CCalcMapa::PosHeliocentricaUp( double jd_ad )
{
	int i;

	ELEMENTOS      *pEle = m_arrayEle;			// aponta para el[i]
	ELEMENTOS      *pEleTerra = m_arrayEle;     // aponta para el[EARTH]
	DADO_ELEMENTO  *pDadoEle = pd;		// aponta para pd[i]
	double td, ti, ti2, tj1, tj2, tj3;

	double ekld[4] = { 23.452294, -46.845, -.0059, 0.00181 };

	if( m_thelup == jd_ad )
	{
		// Se j� foi calculada para esta data
		return; 
	}

	for( i = SUN; i <= MARS; i++, pDadoEle++, pEle++ ) 
	{
		td = jd_ad - pDadoEle->epoch;
		ti = pEle->tj = td / 36525.0;	// S�culos julianos a partir da �poca
		ti2 = ti * ti;
		tj1 = ti / 3600.0;				// Coeficientes em segundos de arco
		tj2 = ti * tj1;
		tj3 = ti * tj2;
		pEle->lg = mod8360( pDadoEle->lg0 + pDadoEle->lg1 * td  + pDadoEle->lg2 * tj2 + pDadoEle->lg3 * tj3);

		// Para a Lua tamb�m lg1 *td ser� exatamente 10e-8 dentro de 5000 anos 
		pEle->pe = mod8360( pDadoEle->pe0 + pDadoEle->pe1 * tj1 + pDadoEle->pe2 * tj2 + pDadoEle->pe3 * tj3);
		pEle->ex = pDadoEle->ex0 + pDadoEle->ex1 * ti + pDadoEle->ex2 * ti2;
		pEle->kn = mod8360( pDadoEle->kn0 + pDadoEle->kn1 * tj1 + pDadoEle->kn2 * tj2 + pDadoEle->kn3 * tj3);
		pEle->in = pDadoEle->in0 + pDadoEle->in1 * tj1 + pDadoEle->in2 * tj2;
		pEle->ma = smod8360( pEle->lg - pEle->pe);

		if( i == MOON ) 
		{
			// Calcula a ecl�ptica de acordo com Newcomb , APAE VI e a nuta��o de acordo com Exp. Suppl, 1961
			// id�ntico ao elemnut() de Mark Pottenger
			// Todos os termos <= 0.01"
			// A teoria de nuta��o da IAU 1984 n�i implementada devido a utiliza��o de outros elementos da Lua e do Sol

			double mnode  = fDEGTORAD * pEle->kn;			// Nodo lunar m�dio
			double mlong2 = fDEGTORAD * 2.0 * pEle->lg;		// 2 x a longitude lunar m�dia
			double mg     = fDEGTORAD * pEle->ma;			// Anomalia lunar m�dia
			double slong2 = fDEGTORAD * 2.0 * pEleTerra->lg;// 2 x longitude solar m�dia( L)
			double sg     = fDEGTORAD * pEleTerra->ma;		// Anomalia solar m�dia
			double d2     = mlong2 - slong2;				// 2 x a elonga��o da lua a partir do sol

			m_dMean_ekl = ekld[0] + ekld[1] * tj1 + ekld[2] * tj2 + ekld[3] * tj3;

			m_ekl =   m_dMean_ekl +
					( 9.2100  * cos( mnode )
					- 0.0904 * cos( 2.0 * mnode )
					+ 0.0183 * cos( mlong2 - mnode )
					+ 0.0884 * cos( mlong2 )
					+ 0.0113 * cos( mlong2 + mg )
					+ 0.5522 * cos( slong2 )
					+ 0.0216 * cos( slong2 + sg ) ) / 3600.0;

			m_dNutacao =  ( ( -17.2327 - 0.01737 * ti) * sin( mnode )
					+ 0.2088 * sin( 2.0 * mnode )
					+ 0.0675 * sin( mg )
					- 0.0149 * sin( mg - d2 )
					- 0.0342 * sin( mlong2 - mnode )
					+ 0.0114 * sin( mlong2 - mg )
					- 0.2037 * sin( mlong2 )
					- 0.0261 * sin( mlong2 + mg )
					+ 0.0124 * sin( slong2 - mnode )
					+ 0.0214 * sin( slong2 - sg )
					- 1.2729 * sin( slong2 )
					- 0.0497 * sin( slong2 + sg )
					+ 0.1261 * sin( sg ) ) / 3600.0;
		}
	}

	// argumentos sa[] para os termos da perturba��es
	ti = ( jd_ad - EPOCA1850 ) / 365.25;  // Anos julianos a partir de  1850 

	for( i = 0; i < SDNUM; i++ )
	{
		m_array_sa [i] = mod8360( _sd [i].sd0 + _sd [i].sd1 * ti );
	}

	
	// sa[2] += 0.3315 * SIN8 ( fDEGTORAD *( 133.9099 + 38.39365 * el[SUN].tj));
	// Corre��o na perturba��es de J�piter de acorco com Pottenger, somente .03" e n�o esclarecido
	
	m_thelup = jd_ad;              
}



// Computa as posi��es de todos os objetos( planetas em astrologia ) menos a Lua. 
// Os c�lculos dos planetas externos a partir de J�piter,
// incluindo Chiron e feita pela rotina OuterPosHeliocentrica
// PosHeliocentrica() calcula a posi��o verdadeira em rela��o a ecl�ptica e data dos equin�cios
// Nuta��es n�o s�o consideradas e por isso devem ser consiredas pela rotina chamadora
// A latitude do Sol ( m�xima de 0,5"segundos de arco ) � considerada como zero

// nPlaneta			�ndice do planetas definida em Defines.h
// dJDEfem;         Dia Juliano relativo � efem�ride
// *pdLon		Longitude em graus
// *pdRaio		Raio em U.A,
// *pdDist		Dist�ncia at� a ecl�ptica em U.A.
// *pdVelLon		Velocidade em graus de longitude por dia
// *pdVelRaio   Velocide em Raio, em UA/dia
// *pdCoorZ;    Velocidade em z, em UA/dia
BOOL CCalcMapa::PosHeliocentrica( int nPlaneta, double dJDEfem, double* pdLon, double* pdRaio, double* pdDist, double* pdVelLon, double* pdVelRaio, double* pdCoorZ )
{
	ELEMENTOS      *pElem;
	DADO_ELEMENTO  *pEleData;

	double lk = 0.0;
	double rk = 0.0;
	double b, h1, sini, sinv, cosi, cosu, cosv, man, dAnomVerdadeira, esquare, k8, u, up, v, vp;

	if( nPlaneta >= JUPITER)
	{
		return( OuterPosHeliocentrica( nPlaneta, dJDEfem, pdLon, pdRaio, pdDist, pdVelLon, pdVelRaio, pdCoorZ ) );
	}

	if( nPlaneta < SUN || nPlaneta == MOON )
	{
		return FALSE;
	}

	pElem = &m_arrayEle[nPlaneta];
	pEleData = &pd[nPlaneta];
	sini = sin( fDEGTORAD * pElem->in );
	cosi = cos( fDEGTORAD * pElem->in );
	esquare = sqrt( ( 1.0 + pElem->ex ) / ( 1.0 - pElem->ex ) ); 
	man = pElem->ma;

	if( nPlaneta == EARTH )  
	{
		// Alguns termos de per�odo longo na longitude
		man += ( 0.266 * sin ( fDEGTORAD * ( 31.8 + 119.0 * pElem->tj ) )
		+ 6.40 * sin( fDEGTORAD * ( 231.19 + 20.2 * pElem->tj ) )
		+ ( 1.882-0.016*pElem->tj ) * sin( fDEGTORAD * ( 57.24 + 150.27 * pElem->tj ) )
		) / 3600.0;
	}

	if( nPlaneta == MARS )  
	{
		// Alguns termos de per�odo longo 
		man += ( 0.606 * sin( fDEGTORAD * ( 212.87 + pElem->tj * 119.051 ) )
		+ 52.490 * sin( fDEGTORAD * ( 47.48 + pElem->tj * 19.771 ) )
		+  0.319 * sin( fDEGTORAD * ( 116.88 + pElem->tj * 773.444 ) )
		+  0.130 * sin( fDEGTORAD * ( 74 + pElem->tj * 163 ) )
		+  0.280 * sin( fDEGTORAD * ( 300 + pElem->tj * 40.8 ) )
		-  ( 37.05 +13.5 * pElem->tj )
		) / 3600.0;
	}

	u = ResolveKepler( man, pElem->ex, 0.0000003 ); // erro de 0.001" 

	cosu = cos( u );
	h1 = 1 - pElem->ex * cosu;
	*pdRaio = pEleData->axis * h1;

	if( fabs( PI - u ) < TANERRLIMIT )
	{
		dAnomVerdadeira = u; // Muito pr�ximo do af�lio
	}
	else
	{
		// Anomalia verdadeira
		dAnomVerdadeira = 2.0 * atan( esquare * tan( u * 0.5 ) ); 
	}

	v = smod8360( dAnomVerdadeira * fRADTODEG + pElem->pe - pElem->kn ); // Arqguneto da latitude

	if( sini == 0.0 || fabs( v -  90.0 ) < TANERRLIMIT || fabs( v - 270.0 ) < TANERRLIMIT ) 
	{
		*pdLon = v;
	} 
	else 
	{
		*pdLon = fRADTODEG * atan( tan( v * fDEGTORAD ) * cosi );

		if( v > 90.0 && v < 270.0 )
		{
			*pdLon += 180.0;
		}
	}

	*pdLon = smod8360( *pdLon + pElem->kn );
	sinv = sin( v * fDEGTORAD );
	cosv = cos( v * fDEGTORAD );
	*pdDist = *pdRaio * sinv * sini;
	b = asin( sinv * sini );     // latitude 
	k8 = cosv / cos( b ) * sini;
	up = 360.0 / pEleData->period / h1;    // du/dt em Graus/dia

	if( fabs( PI - u ) < TANERRLIMIT )
	{
		vp = up / esquare;  // Velociade no af�lio
	}
	else
	{
		vp = up * esquare * ( 1 + cos ( dAnomVerdadeira ) ) / ( 1 + cosu );
	}

	// dv/dt em Graus/dia
	*pdVelRaio = pEleData->axis * up * fDEGTORAD * sin( u ) * pElem->ex;

	// dr/dt UA/dia
	*pdCoorZ = *pdVelRaio * sinv * sini + *pdRaio * vp * fDEGTORAD * cosv * sini;  

	*pdVelLon = vp / cosi * ( 1 - k8 * k8 );

	// Perturba��es
	switch ( nPlaneta ) 
	{
		double am, mma, ema, u2;

		case EARTH:
		{
			am  = fDEGTORAD * smod8360( m_arrayEle[MOON].lg - pElem->lg + 180.0 ); // Graus
			mma = fDEGTORAD * m_arrayEle[MOON].ma;
			ema = fDEGTORAD * pElem->ma;
			u2 = 2.0 * fDEGTORAD * ( pElem->lg - 180.0 - m_arrayEle[MOON].kn ); // 2u' 
			lk = 6.454 * sin( am )
			+ 0.013 * sin( 3.0 * am )
			+ 0.177 * sin( am + mma )
			- 0.424 * sin( am - mma )
			+ 0.039 * sin( 3.0 * am - mma )
			- 0.064 * sin( am + ema )
			+ 0.172 * sin( am - ema )
			- 0.013 * sin( am - mma - ema )
			- 0.013 * sin( u2 );

			rk = 13360 * cos( am )
			+ 30    * cos( 3.0 * am )
			+ 370   * cos( am + mma )
			- 1330  * cos( am - mma )
			+ 80    * cos( 3.0 * am - mma )
			- 140   * cos( am + ema )
			+ 360   * cos( am - ema )
			- 30    * cos( am - mma - ema )
			+ 30    * cos( u2 );

			lk += 0.202 * sin( fDEGTORAD * ( 315.6 + 893.3 * pElem->tj ) );
			CalcPerturbacao( sKor_Terra, pdLon, pdRaio, lk, rk, man );

			break;
		}

		case MERCURY:  
		{
			CalcPerturbacao( sKor_Mercurio, pdLon, pdRaio, 0.0, 0.0, man );
			break;
		}

		case VENUS:  
		{
			lk = ( 2.761 - 0.22*pElem->tj ) * sin( fDEGTORAD * ( 237.24 + 150.27 * pElem->tj ) )
			+ 0.269 * sin( fDEGTORAD * ( 212.2  + 119.05 * pElem->tj ) )
			- 0.208 * sin( fDEGTORAD * ( 175.8  + 1223.5 * pElem->tj ) );

			CalcPerturbacao( sKor_Venus, pdLon, pdRaio, lk, 0.0, man );

			break;
		}

		case MARS: 
		{
			CalcPerturbacao( sKor_Marte, pdLon, pdRaio, 0.0, 0.0, man );

			break;
		}
	}

	return TRUE;
}


// *k;		
// *dLon,			Longitude em graus
// *dRadio			Raio em Unidade astrn�mica
// dCorrecLon		Corre��o na longitude em Segundos de arco, pode ser chamada dCorrecLon rk <> 0, mas n�o retorna valor
// rk,				Corre��o no raio na unidade  nona casa do log de r 
// dAnomaliaMedia	Anomaliza m�dia do planeta man;	mean anomaly of planet 
void CCalcMapa::CalcPerturbacao( KOR* k, double* dLon, double* dRaio, double dCorrecLon, double rk, double dAnomaliaMedia )
{
	double  dArg;

	while( k->j != ENDMARK ) 
	{
		dArg = k->j * m_array_sa[k->k] + k->i * dAnomaliaMedia;

		dCorrecLon += k->lampl * cos( fDEGTORAD * ( k->lphase - dArg ) );

		rk += k->rampl * cos( fDEGTORAD * ( k->rphase - dArg ) );

		k++;
	}

	*dRaio *= pow( 10.0, rk * 1.0E-9 );  

	*dLon += dCorrecLon / 3600.0;
}




//
// OuterPosHeliocentrica()
// Computa as posi��es de J�piter, Saturno, Urano, Netuno e Plut�o e Chiron
// pela leitura das efem�rides e pela aplica��o da Interpola��o 
// O Erro de interpola��o � menor que 0.01" segundos de arco
// dJDEfem;  // Dia Juliano relativo � efem�ride
BOOL CCalcMapa::OuterPosHeliocentrica( int nPlaneta, double dJDEfem, double* al, double* ar, double* az, double* alp, double* arp, double* azp )
{
	static double dFlagJ0Externos   = HUGE8;
	static double dFlagJ0Chiron     = HUGE8;
	static double dFlagJ0Asteroides = HUGE8;
	static long icoord[6][5][3], chicoord[6][3], ascoord[6][4][3];

	double j0, jd, jfrac;

	double l[6], r[6], z[6];

	int n, order, p;

	if( ( nPlaneta < JUPITER || nPlaneta > PLUTO ) && nPlaneta != CHIRON && ( nPlaneta < DEMETER || nPlaneta > VESTA ) )
	{
		return FALSE;
	}

	// Se for JUPITER=5, SATURN=6, URANUS=7, NEPTUNE=8 PLUTO=9, CHIRON=12, DEMETER=14, PALLAS=15, JUNO=16 ou VESTA=17

	jd = dJDEfem + JUL_OFFSET;

	j0 = floor( ( jd - 0.5 ) / m_nPassoEfemeride ) * m_nPassoEfemeride + 0.5;

	jfrac = ( jd - j0 ) / m_nPassoEfemeride;

	if( nPlaneta == CHIRON ) 
	{
		// se for CHIRON=12
		if( dFlagJ0Chiron != j0 ) 
		{
			for( n = 0; n < 6; n++ )  // L� seis dias
			{
				jd = j0 + ( n - 2 ) * m_nPassoEfemeride;

				if( !PegaPosEfemerideChiron( jd ) )
				{
					return FALSE;
				}

				UINT nBytesRead = m_ChiEfem.Read( &chicoord[n][0], 3 * sizeof( long ) );
			}

			dFlagJ0Chiron = j0;
		}

		for( n = 0; n < 6; n++ ) 
		{
			l[n] = chicoord[n][0] / fDEGTOMSEC;
			r[n] = chicoord[n][1] / fAUTOINT;
			z[n] = chicoord[n][2] / fAUTOINT;
		}
	} 
	else if( nPlaneta >= DEMETER && nPlaneta <= VESTA ) 
	{
		// DEMETER=14, PALLAS=15, JUNO=16. VESTA=17

		if( dFlagJ0Asteroides != j0 )   // L� dados dos quatros aster�ides para as 6 etapas de c�lculo
		{
			for( n = 0; n < 6; n++ ) 
			{
				jd = j0 + ( n - 2 ) * m_nPassoEfemeride;

				if( !PegaPosEfemerideAsteroides( jd ) )
				{
					return FALSE;
				}

				UINT nBytesRead = m_AstEfem.Read( &ascoord[n][0][0], 12 * sizeof( long ) );
			}

			dFlagJ0Asteroides = j0;  // Estava errado aqui 
		}

		p = nPlaneta - DEMETER;

		for( n = 0; n < 6; n++ ) 
		{
			l[n] = ascoord[n][p][0] / fDEGTOMSEC;
			r[n] = ascoord[n][p][1] / fAUTOINT;
			z[n] = ascoord[n][p][2] / fAUTOINT;
		}
	} 
	else 
	{  
		// Se for JUPITER=5, SATURN=6, URANUS=7, NEPTUNE=8 PLUTO=9
		if( dFlagJ0Externos != j0 )   // L� dados de todos os 5 planetas para as seis etapas
		{
			for( n = 0; n < 6; n++ ) 
			{
				jd = j0 + ( n - 2 ) * m_nPassoEfemeride;

				if( !PegaPosEfemeridePlanetasExternos( jd ) )
				{
					return FALSE;
				}

				UINT nBytesRead = m_ExtEfem.Read( &icoord[n][0][0], 15 * sizeof( long ) );
			}

			dFlagJ0Externos = j0;
		}

		p = nPlaneta - JUPITER;

		for( n = 0; n < 6; n++ ) 
		{
			l[n] = icoord[n][p][0] / fDEGTOMSEC;
			r[n] = icoord[n][p][1] / fAUTOINT;
			z[n] = icoord[n][p][2] / fAUTOINT;
		}
	}

	if( nPlaneta > SATURN )
	{
		order = 3;
	}
	else
	{
		order = 5;
	}

	Interpolar( 2, order, jfrac, l, al, alp );

	*alp /= m_nPassoEfemeride;

	Interpolar( 2, order, jfrac, r, ar, arp );

	*arp /= m_nPassoEfemeride;

	Interpolar( 2, order, jfrac, z, az, azp );

	*azp /= m_nPassoEfemeride;

	return TRUE;
}



// Interpola��o de Everett, realizada ap�s a de Pottenger ( vers�o 9 de Jul 1988 por Alois Treindl
// 
// nIndex		Interpolar entre x[nIndex] e x[nIndex-1], argument nIndex+p 
// nOrdem		ordem da interpola��o, m�xima 5 
// dArgInterp	Arqumento da interpola��o
// x[],			array ocom os valores, necess�rio existir x[nIndex-nOrdem]..x[nIndex+nOrdem] 
// *axu,		aponta para o resultado
// *adxu;		aponta para o resultado de dx/dt
void CCalcMapa::Interpolar( int nIndex, int nOrdem, double dArgInterp, double x[], double*axu, double* adxu )
{
	static double q, q2, q3, q4, q5, p2, p3, p4, p5, u, u0, u1, u2;
	static double lastp = 9999;
	double dm2, dm1, d0, dp1, dp2,d2m1, d20, d2p1, d2p2, d30, d3p1, d3p2, d4p1, d4p2;
	double offset = 0.0;

	if( lastp != dArgInterp ) 
	{
		q  = 1.0-dArgInterp;
		q2 = q*q;
		q3 = ( q+1.0 )*q*( q-1.0 )/6.0;	
		p2 = dArgInterp*dArgInterp;
		p3 = ( dArgInterp+1.0 )*dArgInterp*( dArgInterp-1.0 )/6.0;
		u  = ( 3.0*p2-1.0 )/6.0;
		u0 = ( 3.0*q2-1.0 )/6.0;
		q4 = q2*q2;
		p4 = p2*p2;
		u1 = ( 5.0*p4-15.0*p2+4.0 )/120.0;
		u2 = ( 5.0*q4-15.0*q2+4.0 )/120.0;
		q5 = q3*( q+2.0 )*( q-2.0 )/20.0;
		p5 = ( dArgInterp+2.0 )*p3*( dArgInterp-2.0 )/20.0;
		lastp = dArgInterp;
	}

	dm1 = x[nIndex] - x[nIndex-1];

	if( dm1 > 180.0 )
	{
		dm1 -= 360.0;
	}

	if( dm1 < -180.0 )
	{
		dm1 += 360.0;
	}

	d0 = x[nIndex+1] - x[nIndex];

	if( d0 > 180.0 ) 
	{
		d0 -= 360.0;
		offset = 360.0;
	}

	if( d0 < -180.0 ) 
	{
		d0 += 360.0;
		offset = -360.0;
	}

	dp1 = x[nIndex+2] - x[nIndex+1];

	if( dp1 > 180.0 )
	{
		dp1 -= 360.0;
	}

	if( dp1 < -180.0 )
	{
		dp1 += 360.0;
	}

	d20  = d0 - dm1; 

	d2p1 = dp1 - d0; 

	// Interpola��o de Everett para ordem 3
	*axu = q*( x[nIndex] + offset ) + q3*d20 + dArgInterp*x[nIndex+1] + p3*d2p1;

	*adxu = d0 + u*d2p1 - u0*d20;

	if( nOrdem > 3 )     // Para ordem 5
	{
		dm2 = x[nIndex-1] - x[nIndex-2];

		if( dm2 > 180.0 )
		{
			dm2 -= 360.0;
		}

		if( dm2 < -180.0 )
		{
			dm2 += 360.0;
		}

		dp2 = x[nIndex+3] - x[nIndex+2];

		if( dp2 > 180.0 )
		{
			dp2 -= 360.0;
		}

		if( dp2 < -180.0 )
		{
			dp2 += 360.0;
		}

		d2m1 = dm1 - dm2;
		d2p2 = dp2 - dp1;
		d30  = d20 - d2m1;
		d3p1 = d2p1 - d20;
		d3p2 = d2p2 - d2p1;
		d4p1 = d3p1 - d30; 
		d4p2 = d3p2 - d3p1;
		*axu  += p5*d4p2 + q5*d4p1;
		*adxu += u1*d4p2 - u2*d4p1;
	}
}

//////////////////////////////////////////////////////////////////////////////////////////////////
// Rotina que obt�m dados da efem�ride dos planetas JUPITER, SATURN, URANUS, NEPTUNE e PLUT�O
//////////////////////////////////////////////////////////////////////////////////////////////////
BOOL CCalcMapa::PegaPosEfemeridePlanetasExternos( double dNumDiasJuliano )
{
	long lPos, lNumDiasJuliano;

	int nTamanhoBloco = 60;				// Tamnho do Bloco

	lNumDiasJuliano = ( long )floor( dNumDiasJuliano );

	int nFator = ( int )( lNumDiasJuliano / 100000 );

	if( lNumDiasJuliano < 0 && nFator*100000 != lNumDiasJuliano )
	{
		nFator--;
	}

	long lJdOffSet = lNumDiasJuliano - nFator*100000;

	lPos = ( lJdOffSet / m_nPassoEfemeride ) * nTamanhoBloco + ( nFator+2 ) * 75000;

	TRY
	{
		if( m_ExtEfem.Seek( lPos, CFile::begin ) == lPos )
		{
			return TRUE;
		}
	}
	CATCH( CFileException, e )
	{
		AfxMessageBox( "Erro na leitura da efem�ride Externos.Efe" );
	}
	END_CATCH

	return FALSE; 
}

//////////////////////////////////////////////////////////////////////////////////////////////////
// Rotina que obt�m dados da efem�ride dos aster�ides DEMETER, PALLAS, JUNO e VESTA
//////////////////////////////////////////////////////////////////////////////////////////////////
BOOL CCalcMapa::PegaPosEfemerideAsteroides( double dNumDiasJuliano )
{
	long lPos, lNumDiasJuliano;

	int nTamanhoBloco = 48;				// Tamnho do Bloco

	lNumDiasJuliano = ( long )floor( dNumDiasJuliano );

	int nFator = ( int )( lNumDiasJuliano / 100000 );

	if( lNumDiasJuliano < 0 && nFator*100000 != lNumDiasJuliano )
	{
		nFator--;
	}

	long lJdOffSet = lNumDiasJuliano - nFator*100000;

	lPos = ( lJdOffSet / m_nPassoEfemeride ) * nTamanhoBloco + ( nFator+2 ) * 60000;

	TRY
	{
		if( m_AstEfem.Seek( lPos, CFile::begin ) == lPos )
		{
			return TRUE;
		}
	}
	CATCH( CFileException, e )
	{
		AfxMessageBox( "Erro na leitura da efem�ride Asteroides.Efe" );
	}
	END_CATCH

	return FALSE; 
}

//////////////////////////////////////////////////////////////////////////////////////////////////
// Rotina que obt�m dados da efem�ride de CHIRON
//////////////////////////////////////////////////////////////////////////////////////////////////
BOOL CCalcMapa::PegaPosEfemerideChiron( double dNumDiasJuliano )
{
	long lPos, lNumDiasJuliano;

	int nTamanhoBloco = 12;				// Tamnho do Bloco

	lNumDiasJuliano = ( long )floor( dNumDiasJuliano );

	int nFator = ( int )( lNumDiasJuliano / 100000 );

	if( lNumDiasJuliano < 0 && nFator*100000 != lNumDiasJuliano )
	{
		nFator--;
	}

	long lJdOffSet = lNumDiasJuliano - nFator*100000;

	lPos = ( lJdOffSet / m_nPassoEfemeride ) * nTamanhoBloco + ( nFator+2 ) * 15000;

	TRY
	{
		if( m_ChiEfem.Seek( lPos, CFile::begin ) == lPos )
		{
			return TRUE;
		}
	}
	CATCH( CFileException, e )
	{
		AfxMessageBox( "Erro na leitura da efem�ride Chiron.Efe" );
	}
	END_CATCH

	return FALSE; 
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
void CCalcMapa::CalculoObjetoLua( double* al, double* ar, double* az )  
{
	double a1,a2,a3,a4,a5,a6,a7,a8,a9,c2,c4,arg,b,d,f,dgc,dlm,dpm,dkm,dls;
	double ca, cb, cd, f_2d, f_4d, g1c,lk,lk1,man,ms,nib,s,sinarg,sinp,sk;
	double t, tb, t2c, r2rad, i1corr, i2corr, dlid;
	int i;

	ELEMENTOS *pEle;

	M45DAT   *mp;

	#if MOON_TEST_CORR
		M5DAT  *m5p;
	#endif

	pEle = &m_arrayEle[MOON];

	t = pEle->tj * 36525;  // dias  da �poca = 1900

	// Para novo formato, par�metros com rota��o a 360 graus

	r2rad = 360.0 * fDEGTORAD;
	tb  = t * 1e-12;												// unidades de 10^12 
	t2c = t * t * 1e-16;											// unidades de 10^16 
	a1 = sin( r2rad * ( 0.53733431 -  10104982 * tb + 191 * t2c ) );
	a2 = sin( r2rad * ( 0.71995354 - 147094228 * tb +  43 * t2c ) );
	c2 = cos( r2rad * ( 0.71995354 - 147094228 * tb +  43 * t2c ) );
	a3 = sin( r2rad * ( 0.14222222 +   1536238 * tb ) );
	a4 = sin( r2rad * ( 0.48398132 - 147269147 * tb +  43 * t2c ) );
	c4 = cos( r2rad * ( 0.48398132 - 147269147 * tb +  43 * t2c ) );
	a5 = sin( r2rad * ( 0.52453688 - 147162675 * tb +  43 * t2c ) );
	a6 = sin( r2rad * ( 0.84536324 -  11459387 * tb ) );
	a7 = sin( r2rad * ( 0.23363774 +   1232723 * tb + 191 * t2c ) );
	a8 = sin( r2rad * ( 0.58750000 +   9050118 * tb ) );
	a9 = sin( r2rad * ( 0.61043085 -  67718733 * tb ) );

	dlm = 0.84 * a3 + 0.31 * a7 + 14.27 * a1 + 7.261  * a2 + 0.282 * a4 + 0.237 * a6;
	dpm = -2.1  * a3 - 2.076  * a2 - 0.840 * a4 - 0.593 * a6;
	dkm = 0.63 * a3 + 95.96 * a2 + 15.58 * a4 + 1.86 * a5;
	dls = -6.4  * a3 - 0.27 * a8 - 1.89  * a6 + 0.20 * a9;
	dgc = ( -4.318 * c2 - 0.698 * c4 ) / 3600.0 / 360.0;			
	dgc = ( 1.000002708 + 139.978 * dgc );  
	man = fDEGTORAD * ( pEle->ma + ( dlm - dpm ) / 3600.0 );

	// Com corre��es peri�dicas e seculares
	ms  = fDEGTORAD * ( m_arrayEle[EARTH].ma + dls / 3600.0 );
	f   = fDEGTORAD * ( pEle->lg - pEle->kn + ( dlm - dkm ) / 3600.0 );
	d   = fDEGTORAD * ( pEle->lg + 180 - m_arrayEle[EARTH].lg + ( dlm - dls ) / 3600.0 );

	lk = lk1 = sk = sinp = nib = g1c = 0;
	i1corr = 1.0 - 6.8320E-8 * t;
	i2corr = dgc * dgc; 

	for( i = 0, mp = m45; i < NUM_MOON_CORR; i++, mp++ ) 
	{
		//arg = mp->i0 * man; arg += mp->i3 * d; arg += mp->i2 * f; arg += mp->i1 * ms; sinarg = sin( arg );

		arg = mp->i0 * man + 
			  mp->i3 * d + 
			  mp->i2 * f + 
			  mp->i1 * ms;

		sinarg = sin( arg );
		
		// Aplicando as corre��es devido �s mudan�as nas constantes
		// Corre��es somente nos termos l' ( i1 ) e F ( i2 ), n�o na l ( i0 ), porque � menor 1ue 0.05 segundos
		// N�o aplica corre��o de paralaxe ( seria para o cos( arg )

		if( mp->i1 != 0 )   // i1 pode assumir valores -2, -1, 0, 1, 2 
		{
			sinarg *= i1corr;
			if  ( mp->i1 == 2 || mp->i1 == -2 )
			{
				sinarg *= i1corr;
			}
		}

		if( mp->i2 != 0 )  // i2 pode assumir valores -2, 0, 2 
		{
			sinarg *= i2corr;
		}

		lk += mp->lng * sinarg;
		sk += mp->lat * sinarg;
		sinp += mp->par * cos ( arg ) ;
	}

	#if MOON_TEST_CORR  // Opcional, mais corre��es
	for( m5p = m5; m5p->i0 != 99; m5p++ )   
	{
		arg = m5p->i0 * man + m5p->i1 * ms + m5p->i2 * f + m5p->i3 * d;
		sinarg = sin( arg );
		lk1 += m5p->lng * sinarg;
	}
	#endif

	// C�mputo dos termos planet�rios em longitude
	// Tomar todos > 0.5" e desprezar os termos seculares nos argumentos. O erros de fase
	// ser� menor que 10 graus ap�s 3000 anos
	dlid =  0.822 * sin ( r2rad * ( 0.32480 - 0.0017125594 * t ) );
	dlid += 0.307 * sin ( r2rad * ( 0.14905 - 0.0034251187 * t ) );
	dlid += 0.348 * sin ( r2rad * ( 0.68266 - 0.0006873156 * t ) );
	dlid += 0.662 * sin ( r2rad * ( 0.65162 + 0.0365724168 * t ) );
	dlid += 0.643 * sin ( r2rad * ( 0.88098 - 0.0025069941 * t ) );
	dlid += 1.137 * sin ( r2rad * ( 0.85823 + 0.0364487270 * t ) );
	dlid += 0.436 * sin ( r2rad * ( 0.71892 + 0.0362179180 * t ) );
	dlid += 0.327 * sin ( r2rad * ( 0.97639 + 0.0001734910 * t ) );

	// Sem as nuta��es
	*al = smod8360( pEle->lg + ( dlm + lk + lk1 + dlid ) / 3600.0 );

	// Termos solares em latitude Nibeta 
	f_2d = f - 2.0 * d;
	f_4d = f - 4.0 * d;
	nib += -526.069 * sin(                    f_2d );
	nib +=   -3.352 * sin(                    f_4d );
	nib +=   44.297 * sin(  man             + f_2d );
	nib +=   -6.000 * sin(  man             + f_4d );
	nib +=   20.599 * sin( -man             + f    );
	nib +=  -30.598 * sin( -man             + f_2d );
	nib +=  -24.649 * sin( -2*man           + f    );
	nib +=   -2.000 * sin( -2*man           + f_2d );
	nib +=  -22.571 * sin(           ms     + f_2d );
	nib +=   10.985 * sin(          -ms     + f_2d );

	// novo gamma1C de 29 Jul 88, todos os termos > 0.4 " na tabela III, c�digo 2 
	g1c += -0.725 * cos(           d );
	g1c +=  0.601 * cos(       2 * d );
	g1c +=  0.394 * cos(       3 * d );
	g1c += -0.445 * cos( man                   + 4 * d );
	g1c +=  0.455 * cos( man                   + 1 * d );
	g1c +=  5.679 * cos( 2 * man               - 2 * d );
	g1c += -1.300 * cos( 3 * man                       );
	g1c += -1.302 * cos(             ms                );
	g1c += -0.416 * cos(             ms        - 4 * d );
	g1c += -0.740 * cos(         2 * ms        - 2 * d );
	g1c +=  0.787 * cos(     man +   ms        + 2 * d );
	g1c +=  0.461 * cos(     man +   ms                );
	g1c +=  2.056 * cos(     man +   ms        - 2 * d );
	g1c += -0.471 * cos(     man +   ms        - 4 * d );
	g1c += -0.443 * cos(    -man +   ms        + 2 * d );
	g1c +=  0.679 * cos(    -man +   ms                );
	g1c += -1.540 * cos(    -man +   ms        - 2 * d );

	s =  f + sk / 3600.0 * fDEGTORAD;
	ca = 18519.7 + g1c;
	cb = -0.000336992 * ca * dgc * dgc * dgc;
	cd = ca / 18519.7;
	b = ( ca * sin( s ) * dgc  + cb * sin( 3.0 * s ) + cd * nib ) / 3600.0;

	// Desprezar termos planet�rios na latitude, c�digo 4 na tabela III
	sinp = ( sinp + 3422.451 );

	*ar = 8.794 / sinp;

	*az = *ar * sin( fDEGTORAD * b );
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Convers�o de Helioc�ntrica para geoc�ntrica
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
void CCalcMapa::HelioToGeocentrico( double lngearth, double radearth, double lng, double rad, double zet, double* alnggeo, double* aradgeo )
{
	double r1, x, y;

	r1 = sqrt( rad * rad - zet * zet );

	x = r1 * cos( fDEGTORAD * lng ) - radearth * cos( fDEGTORAD * lngearth );

	y = r1 * sin( fDEGTORAD * lng ) - radearth * sin( fDEGTORAD * lngearth );

	*aradgeo = sqrt( x * x + y * y + zet * zet );

	x = TesteProximidadeZero( x );

	*alnggeo = smod8360( fRADTODEG * atan2( y, x ) );
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//	Rotinas para trabalhar com centisegundos
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
double CCalcMapa::NormalizaDeg( double dVal )
{
	if ( dVal < 0.0 )
	{
		do 
		{
			dVal += 360.0;
		} 
		while( dVal < 0.0 );
	}
	else if( dVal >= 360.0)
	{
		do 
		{
			dVal -= 360.0;
		} 
		while( dVal >= 360.0 );
	}

	return ( dVal );
}


#if 0
void CCalcMapa::ListaTeste()
{
	int i = 0;
	///////////////////////////////////////////////////////////
	// Lista os calculados
	/////////////////////////////////////////////////////////
	CString oszBuffer;

	CString osz = "\n\n-------------------------------------------------------------------\n";
	oszBuffer += osz;

	osz.Format ( "Meio do C�u: %20.15lf\n", m_dMC );
	oszBuffer += osz;

	osz.Format ( "Ascendente : %20.15lf\n", m_dAsc );
	oszBuffer += osz;
	
	osz.Format ( "V�rtice    : %20.15lf\n", m_dPosVertice );
	oszBuffer += osz;

	
	oszBuffer += "-------------------------------------------------------------------\n";
	oszBuffer += "�ngulo das c�spides\n";
	oszBuffer += "-------------------------------------------------------------------\n";

	for( int i=0; i < cSign+1; i++ )
	{
		osz.Format( "idx = %d %c %15.10lf Graus   %10s\n", i, '\t', sChartPos0.cusp[i], DecToHms( sChartPos0.cusp[i] ) );
		oszBuffer += osz;
	}

	oszBuffer += "\n\n-------------------------------------------------------------------\n";
	oszBuffer += "Posi��o zodiacal dos objetos ( Ecliptico )\n";
	oszBuffer += "-------------------------------------------------------------------\n";
	

	for( i=0; i < 31; i++ )
	{		
		osz.Format( "%20s   %15.10lf   %10s\n", m_aoszObjetos.GetAt( i ), sChartPos0.LongitEcliptica[i], PlanetToCusp( sChartPos0.LongitEcliptica[i] ) );
		oszBuffer += osz;
	}

	oszBuffer += "\n\n-------------------------------------------------------------------------------\n";
	oszBuffer += "Posi��o zodiacal dos objetos ( Equatorial )\n";
	oszBuffer += "-------------------------------------------------------------------------------\n";
	
	for( i=0; i < 31; i++ )
	{		
		osz.Format( "%20s   %15.10lf   %10s\n", m_aoszObjetos.GetAt( i ), sChartPos0.AscensaoReta[i], PlanetToCusp( sChartPos0.AscensaoReta[i] ) );
		oszBuffer += osz;
	}


	oszBuffer += "\n\n-------------------------------------------------------------------------------\n";
	oszBuffer += "Objetos\n";
	oszBuffer += "-------------------------------------------------------------------------------\n";
	oszBuffer += "Objeto          Ascens�o Reta             Declina��o              Latitude\n\n";
	
	for( i=1; i < 31; i++ )
	{		
		osz.Format( "%-10.10s %14.10lf %7s %14.10lf %7s %14.10lf %7s\n", m_aoszObjetos.GetAt( i ), sChartPos0.AscensaoReta[i], DecToHm( sChartPos0.AscensaoReta[i] ), 
			                                                                sChartPos0.Declinacao[i], DecToHm( sChartPos0.Declinacao[i] ), 
																			sChartPos0.LatitEcliptica[i] , DecToHm( sChartPos0.LatitEcliptica[i] ) );
		oszBuffer += osz;
	}

	oszBuffer += "\n\n-------------------------------------------------------------------------------\n";
	oszBuffer += "Velocidade de Retrograda��o\n";
	oszBuffer += "-------------------------------------------------------------------------------\n";
	oszBuffer += "                                    G  M \n";
	for( i=0; i < 31; i++ )
	{		

		osz.Format( "%20s  %+7.3lf  %10s\n", m_aoszObjetos.GetAt( i ),RADTODEG(sChartPos0.Velocidade[i]), RadToHm( sChartPos0.Velocidade[i] ) );
		oszBuffer += osz;
	}

	oszBuffer += "\n\n-------------------------------------------------------------------------------\n";
	oszBuffer += "Casa Ocupada\n";
	oszBuffer += "-------------------------------------------------------------------------------\n";
	
	
	for( i=0; i < 31; i++ )
	{		
		osz.Format( "%20s   %d\n", m_aoszObjetos.GetAt( i ), sChartPos0.house[i] );
		oszBuffer += osz;
	}

	TRY
	{
		CFile oFile( "Teste.txt", CFile::modeCreate|CFile::modeWrite );

		oFile.Write ( oszBuffer.GetBuffer(0), oszBuffer.GetLength() );

		oFile.Close();
	}
	CATCH( CFileException, e )
	{
		AfxMessageBox( "Erro no arquivo Teste.txt" );
	}
	END_CATCH
}
#endif

// Fix.
// M�todo est�tico (n�o membro da classe) que � chamado no constructor de CTgMetaAngulo e
// pode ser chamado por qualquer outro m�dulo do programa sem ser necess�rio criar um objeto desta classe.

double CCalcMapa::Fix( double dValor, int nPrecis )
{
	// Guarda o valor absoluto de dValor.

	double dVal = fabs( dValor );

	// Se for menor que a precis�o de double estabelece zero.

	if( dVal < DBL_EPSILON )
	{
		return 0.0;
	}

	// Guarda a pot�ncia de 10 necess�ria aos c�lculos.

	double dPot10 = pow( 10, nPrecis );

	// Se o valor � zero ou muito pr�ximo retorna �.

	if( dVal < 0.5 / dPot10 )
	{
		return 0.0;
	}
	
	// Multiplica o valor pela pot�ncia de dez da precis�o e soma 0.501 para arredondar a parte fracion�ria.
	// floor retorna um double que representa o maior inteiro que � menor ou igual ao seu argumento.

	dVal = floor( dVal * dPot10 + 0.501 ) / dPot10;

	return ( dValor > 0.0 ) ? dVal : -dVal;
}

