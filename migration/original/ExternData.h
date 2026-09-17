#if !defined(AFX_EXTERNDATA_H__BA0F5E9A_DEAE_4576_9415_1880A41E327E__INCLUDED_)
#define AFX_EXTERNDATA_H__BA0F5E9A_DEAE_4576_9415_1880A41E327E__INCLUDED_


extern int nIgnorar[objMax];  // Restrições para cada objeto
extern int nIgnorar2[objMax]; // Restrições para cada objeto no trânsito
extern int nIgnorarz[4];		// Restrições aplicável aos eventos do mapa
extern ELEMENTOS_ORBITAIS rgoe[oVes-1+cUran];
extern DADO_ELEMENTO pd[MARS + 1];
extern SDAT _sd[SDNUM];
extern KOR sKor_Terra[86+1];
extern KOR sKor_Mercurio[24+1];
extern KOR sKor_Venus[22+1]; 
extern KOR sKor_Marte[62+1]; 
extern M45DAT m45[NUM_MOON_CORR];
extern M5DAT m5[]; 

#endif  // #define AFX_EXTERNDATA_H__BA0F5E9A_DEAE_4576_9415_1880A41E327E__INCLUDED_
