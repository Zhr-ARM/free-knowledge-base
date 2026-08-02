import{g as l,o,c as s,j as n,a as e,k as d,a5 as _,t}from"./chunks/framework.B5tqjWbr.js";const u={class:"kb-download-actions"},E=["href"],m={class:"kb-archive-preview"},C={class:"kb-source-previews","aria-labelledby":"doc-fdb02902fe-source-heading"},c={class:"kb-preview-panel kb-code-preview",open:""},p=["textContent"],L={class:"kb-preview-panel kb-code-preview"},h=["textContent"],F={class:"kb-preview-panel kb-code-preview"},D=["textContent"],g={class:"kb-preview-panel kb-code-preview"},v=["textContent"],O={class:"kb-preview-panel kb-code-preview"},f=["textContent"],b={class:"kb-preview-panel kb-code-preview"},P=["textContent"],S={class:"kb-preview-panel kb-code-preview"},y=["textContent"],B={class:"kb-preview-panel kb-code-preview"},R=["textContent"],w={class:"kb-preview-panel kb-code-preview"},k=["textContent"],A={class:"kb-preview-panel kb-code-preview"},N=["textContent"],I={class:"kb-preview-panel kb-code-preview"},T=["textContent"],W={class:"kb-preview-panel kb-code-preview"},K=["textContent"],H={class:"kb-preview-panel kb-code-preview"},j=["textContent"],M={class:"kb-preview-panel kb-code-preview"},X=["textContent"],Y={class:"kb-preview-panel kb-code-preview"},U=["textContent"],z={class:"kb-preview-panel kb-code-preview"},V=["textContent"],Q=JSON.parse('{"title":"51单片机基础练习源码","description":"嵌入式 / 51单片机 / 基础练习 · ZIP · 33.3 KB","frontmatter":{"search":false,"aside":false,"pageClass":"kb-wide-document","title":"51单片机基础练习源码","description":"嵌入式 / 51单片机 / 基础练习 · ZIP · 33.3 KB","searchTitle":"51单片机基础练习源码","searchPath":"嵌入式 / 51单片机 / 基础练习","searchType":"ZIP"},"headers":[],"relativePath":"library/generated/doc-fdb02902fe.md","filePath":"library/generated/doc-fdb02902fe.md","lastUpdated":null}'),Z={name:"library/generated/doc-fdb02902fe.md"},$=Object.assign(Z,{setup(J){const i=l("/uploads/raw/%E5%B5%8C%E5%85%A5%E5%BC%8F/02-51%E5%8D%95%E7%89%87%E6%9C%BA/%E5%9F%BA%E7%A1%80%E7%BB%83%E4%B9%A0/51%E5%8D%95%E7%89%87%E6%9C%BA%E5%9F%BA%E7%A1%80%E7%BB%83%E4%B9%A0%E6%BA%90%E7%A0%81.zip"),a=`   9.0 KB  51_oled/OLED_Font.h
   7.3 KB  51_oled/oled.c
    671 B  51_oled/oled.h
   1.2 KB  led_beep_relay_time/driver/hardware.c
    273 B  led_beep_relay_time/driver/hardware.h
   6.3 KB  led_beep_relay_time/main.uvopt
  14.4 KB  led_beep_relay_time/main.uvproj
   6.2 KB  led_beep_relay_time/STARTUP.A51
   2.6 KB  led_beep_relay_time/user/main.c
   1.3 KB  led_beep_relay_time/vscode/.eide/eide.yml
    689 B  led_beep_relay_time/vscode/.eide/files.options.yml
     50 B  led_beep_relay_time/vscode/.eide/stc.flash.json
   1.2 KB  led_beep_relay/driver/hardware.c
    273 B  led_beep_relay/driver/hardware.h
   5.8 KB  led_beep_relay/main.uvopt
  14.4 KB  led_beep_relay/main.uvproj
   6.2 KB  led_beep_relay/STARTUP.A51
   1.7 KB  led_beep_relay/user/main.c
    308 B  README.txt
   1.2 KB  Round_Robin/driver/hardware.c
    273 B  Round_Robin/driver/hardware.h
   6.3 KB  Round_Robin/main.uvopt
  14.4 KB  Round_Robin/main.uvproj
   6.2 KB  Round_Robin/STARTUP.A51
   1.9 KB  Round_Robin/user/main.c
   1.3 KB  Round_Robin/vscode/.eide/eide.yml
    689 B  Round_Robin/vscode/.eide/files.options.yml
     50 B  Round_Robin/vscode/.eide/stc.flash.json`,x=[`51单片机基础练习源码

本压缩包由开源协会知识库从学习目录中自动精选生成。
已排除安装包、视频、编译缓存、目标文件、可执行文件、私钥和大型第三方依赖。
部分工程需要通过对应 IDE、SDK 或配置文件重新生成依赖后再编译。`,`#include "OLED_Font.h"\r
\r
/*引脚配置*/\r
sbit OLED_W_SCL=P2^0;\r
sbit OLED_W_SDA=P2^1;\r
\r
\r
/**\r
  * @brief  I2C开始\r
  * @param  无\r
  * @retval 无\r
  */\r
void OLED_I2C_Start(void)\r
{\r
	OLED_W_SDA=1;\r
	OLED_W_SCL=1;\r
	OLED_W_SDA=0;\r
	OLED_W_SCL=0;\r
}\r
\r
/**\r
  * @brief  I2C停止\r
  * @param  无\r
  * @retval 无\r
  */\r
void OLED_I2C_Stop(void)\r
{\r
	OLED_W_SDA=0;\r
	OLED_W_SCL=1;\r
	OLED_W_SDA=1;\r
}\r
void IIC_Wait_Ack()\r
{\r
	OLED_W_SCL=1;\r
	OLED_W_SCL=0;\r
}\r
/**\r
  * @brief  I2C发送一个字节\r
  * @param  Byte 要发送的一个字节\r
  * @retval 无\r
  */\r
void OLED_I2C_SendByte(unsigned char Byte)\r
{\r
	unsigned char i;\r
	OLED_W_SCL=0;\r
	for (i = 0; i < 8; i++)\r
	{\r
		OLED_W_SDA=Byte & (0x80 >> i);\r
		OLED_W_SCL=1;\r
		OLED_W_SCL=0;\r
	}\r
	\r
}\r
\r
/**\r
  * @brief  OLED写命令\r
  * @param  Command 要写入的命令\r
  * @retval 无\r
  */\r
void OLED_WriteCommand(unsigned char Command)\r
{\r
	OLED_I2C_Start();\r
	OLED_I2C_SendByte(0x78);		//从机地址\r
	IIC_Wait_Ack();\r
	OLED_I2C_SendByte(0x00);		//写命令\r
	IIC_Wait_Ack();\r
	OLED_I2C_SendByte(Command); \r
	IIC_Wait_Ack();\r
	OLED_I2C_Stop();\r
}\r
\r
/**\r
  * @brief  OLED写数据\r
  * @param  Data 要写入的数据\r
  * @retval 无\r
  */\r
void OLED_WriteData(unsigned char Data)\r
{\r
	OLED_I2C_Start();\r
	OLED_I2C_SendByte(0x78);		//从机地址\r
	IIC_Wait_Ack();\r
	OLED_I2C_SendByte(0x40);		//写数据\r
	IIC_Wait_Ack();\r
	OLED_I2C_SendByte(Data);\r
	IIC_Wait_Ack();\r
	OLED_I2C_Stop();\r
}\r
\r
/**\r
  * @brief  OLED设置光标位置\r
  * @param  Y 以左上角为原点，向下方向的坐标，范围：0~7\r
  * @param  X 以左上角为原点，向右方向的坐标，范围：0~127\r
  * @retval 无\r
  */\r
void OLED_SetCursor(unsigned char Y, unsigned char X)\r
{\r
	OLED_WriteCommand(0xB0 | Y);					//设置Y位置\r
	OLED_WriteCommand(0x10 | ((X & 0xF0) >> 4));	//设置X位置高4位\r
	OLED_WriteCommand((X & 0x0F));			//设置X位置低4位\r
}\r
\r
/**\r
  * @brief  OLED清屏\r
  * @param  无\r
  * @retval 无\r
  */\r
void OLED_Clear(void)\r
{  \r
	unsigned char i, j;\r
	for (j = 0; j < 8; j++)\r
	{\r
		OLED_SetCursor(j, 0);\r
		for(i = 0; i < 128; i++)\r
		{\r
			OLED_WriteData(0x00);\r
		}\r
	}\r
}\r
\r
/**\r
  * @brief  OLED显示一个字符\r
  * @param  Line 行位置，范围：1~4\r
  * @param  Column 列位置，范围：1~16\r
  * @param  Char 要显示的一个字符，范围：ASCII可见字符\r
  * @retval 无\r
  */\r
void OLED_ShowChar(unsigned char Line, unsigned char Column, char Char)\r
{      	\r
	unsigned char i;\r
	OLED_SetCursor((Line - 1) * 2, (Column - 1) * 8);		//设置光标位置在上半部分\r
	for (i = 0; i < 8; i++)\r
	{\r
		OLED_WriteData(OLED_F8x16[Char - ' '][i]);			//显示上半部分内容\r
	}\r
	OLED_SetCursor((Line - 1) * 2 + 1, (Column - 1) * 8);	//设置光标位置在下半部分\r
	for (i = 0; i < 8; i++)\r
	{\r
		OLED_WriteData(OLED_F8x16[Char - ' '][i + 8]);		//显示下半部分内容\r
	}\r
}\r
\r
/**\r
  * @brief  OLED显示字符串\r
  * @param  Line 起始行位置，范围：1~4\r
  * @param  Column 起始列位置，范围：1~16\r
  * @param  String 要显示的字符串，范围：ASCII可见字符\r
  * @retval 无\r
  */\r
void OLED_ShowString(unsigned char Line, unsigned char Column, char *String)\r
{\r
	unsigned char i;\r
	for (i = 0; String[i] != '\\0'; i++)\r
	{\r
		OLED_ShowChar(Line, Column + i, String[i]);\r
	}\r
}\r
\r
/**\r
  * @brief  OLED次方函数\r
  * @retval 返回值等于X的Y次方\r
  */\r
unsigned int OLED_Pow(unsigned int X, unsigned int Y)\r
{\r
	unsigned int Result = 1;\r
	while (Y--)\r
	{\r
		Result *= X;\r
	}\r
	return Result;\r
}\r
\r
/**\r
  * @brief  OLED显示数字（十进制，正数）\r
  * @param  Line 起始行位置，范围：1~4\r
  * @param  Column 起始列位置，范围：1~16\r
  * @param  Number 要显示的数字，范围：0~4294967295\r
  * @param  Length 要显示数字的长度，范围：1~10\r
  * @retval 无\r
  */\r
void OLED_ShowNum(unsigned char Line, unsigned char Column, unsigned int Number, unsigned char Length)\r
{\r
	unsigned char i;\r
	for (i = 0; i < Length; i++)							\r
	{\r
		OLED_ShowChar(Line, Column + i, Number / OLED_Pow(10, Length - i - 1) % 10 + '0');\r
	}\r
}\r
\r
/**\r
  * @brief  OLED显示数字（十进制，带符号数）\r
  * @param  Line 起始行位置，范围：1~4\r
  * @param  Column 起始列位置，范围：1~16\r
  * @param  Number 要显示的数字，范围：-2147483648~2147483647\r
  * @param  Length 要显示数字的长度，范围：1~10\r
  * @retval 无\r
  */\r
void OLED_ShowSignedNum(unsigned char Line, unsigned char Column, int Number, unsigned char Length)\r
{\r
	unsigned char i;\r
	unsigned int Number1;\r
	if (Number >= 0)\r
	{\r
		OLED_ShowChar(Line, Column, '+');\r
		Number1 = Number;\r
	}\r
	else\r
	{\r
		OLED_ShowChar(Line, Column, '-');\r
		Number1 = -Number;\r
	}\r
	for (i = 0; i < Length; i++)							\r
	{\r
		OLED_ShowChar(Line, Column + i + 1, Number1 / OLED_Pow(10, Length - i - 1) % 10 + '0');\r
	}\r
}\r
\r
/**\r
  * @brief  OLED显示数字（十六进制，正数）\r
  * @param  Line 起始行位置，范围：1~4\r
  * @param  Column 起始列位置，范围：1~16\r
  * @param  Number 要显示的数字，范围：0~0xFFFFFFFF\r
  * @param  Length 要显示数字的长度，范围：1~8\r
  * @retval 无\r
  */\r
void OLED_ShowHexNum(unsigned char Line, unsigned char Column, unsigned int Number, unsigned char Length)\r
{\r
	unsigned char i, SingleNumber;\r
	for (i = 0; i < Length; i++)							\r
	{\r
		SingleNumber = Number / OLED_Pow(16, Length - i - 1) % 16;\r
		if (SingleNumber < 10)\r
		{\r
			OLED_ShowChar(Line, Column + i, SingleNumber + '0');\r
		}\r
		else\r
		{\r
			OLED_ShowChar(Line, Column + i, SingleNumber - 10 + 'A');\r
		}\r
	}\r
}\r
\r
/**\r
  * @brief  OLED显示数字（二进制，正数）\r
  * @param  Line 起始行位置，范围：1~4\r
  * @param  Column 起始列位置，范围：1~16\r
  * @param  Number 要显示的数字，范围：0~1111 1111 1111 1111\r
  * @param  Length 要显示数字的长度，范围：1~16\r
  * @retval 无\r
  */\r
void OLED_ShowBinNum(unsigned char Line, unsigned char Column, unsigned int Number, unsigned char Length)\r
{\r
	unsigned char i;\r
	for (i = 0; i < Length; i++)							\r
	{\r
		OLED_ShowChar(Line, Column + i, Number / OLED_Pow(2, Length - i - 1) % 2 + '0');\r
	}\r
}\r
\r
/**\r
  * @brief  OLED初始化\r
  * @param  无\r
  * @retval 无\r
  */\r
void OLED_Init(void)\r
{\r
	OLED_WriteCommand(0xAE);	//关闭显示\r
	\r
	OLED_WriteCommand(0xD5);	//设置显示时钟分频比/振荡器频率\r
	OLED_WriteCommand(0x80);\r
	\r
	OLED_WriteCommand(0xA8);	//设置多路复用率\r
	OLED_WriteCommand(0x3F);\r
	\r
	OLED_WriteCommand(0xD3);	//设置显示偏移\r
	OLED_WriteCommand(0x00);\r
	\r
	OLED_WriteCommand(0x40);	//设置显示开始行\r
	\r
	OLED_WriteCommand(0xA1);	//设置左右方向，0xA1正常 0xA0左右反置\r
	\r
	OLED_WriteCommand(0xC8);	//设置上下方向，0xC8正常 0xC0上下反置\r
\r
	OLED_WriteCommand(0xDA);	//设置COM引脚硬件配置\r
	OLED_WriteCommand(0x12);\r
	\r
	OLED_WriteCommand(0x81);	//设置对比度控制\r
	OLED_WriteCommand(0xCF);\r
\r
	OLED_WriteCommand(0xD9);	//设置预充电周期\r
	OLED_WriteCommand(0xF1);\r
\r
	OLED_WriteCommand(0xDB);	//设置VCOMH取消选择级别\r
	OLED_WriteCommand(0x30);\r
\r
	OLED_WriteCommand(0xA4);	//设置整个显示打开/关闭\r
\r
	OLED_WriteCommand(0xA6);	//设置正常/倒转显示\r
\r
	OLED_WriteCommand(0x8D);	//设置充电泵\r
	OLED_WriteCommand(0x14);\r
\r
	OLED_WriteCommand(0xAF);	//开启显示\r
		\r
	OLED_Clear();				//OLED清屏\r
}\r
`,`#include "hardware.h"\r
\r
// LED控制函数\r
void LED_Control(unsigned char state)\r
{\r
    /***************开门*****************/\r
    P2&=0x1F; //将P2口高三位清零\r
    P2|=0x80; //将P27设置为高电平P26,P25为低电平，选择控制LED的Y4对应的锁存器\r
    //0x80=1000 0000\r
    /****************送“外卖”*****************/\r
    P0 = state; //将state的值送到P0口\r
     /***************关门*****************/\r
    P2&=0x1F; //将P2口高三位清零\r
}\r
\r
// 蜂鸣器和继电器控制函数\r
void BEEP_Relay_Control(unsigned char BEEP_state, unsigned char Relay_state)\r
{\r
    /***************开门****************/\r
    P2&=0x1F; //将P2口高三位清零\r
    P2|=0xa0; //将P27,P26设置为高电平，选择控制蜂鸣器和继电器的Y5对应的锁存器\r
    //0xA0=1010 0000\r
    /***************送“外卖”*****************/\r
    P0=0X00; //先将P0口清零\r
    if(BEEP_state==ON)\r
        P0|=0x40; //0x40=0100 0000 将P06位置高电平，控制蜂鸣器鸣叫\r
    else\r
        P0&=~0x40; //将P06位置低电平，控制蜂鸣器停止鸣叫\r
    if(Relay_state==ON)\r
        P0|=0x10; //0x10=0001 0000 将P04位置高电平，控制继电器吸合\r
    else\r
        P0&=~0x10; //将P04位置低电平，控制继电器释放\r
    /***************关门*****************/\r
    P2=P2&0x1f;\r
}`,`#include "hardware.h"\r
\r
// LED控制函数\r
void LED_Control(unsigned char state)\r
{\r
    /***************开门*****************/\r
    P2&=0x1F; //将P2口高三位清零\r
    P2|=0x80; //将P27设置为高电平P26,P25为低电平，选择控制LED的Y4对应的锁存器\r
    //0x80=1000 0000\r
    /****************送“外卖”*****************/\r
    P0 = state; //将state的值送到P0口\r
     /***************关门*****************/\r
    P2&=0x1F; //将P2口高三位清零\r
}\r
\r
// 蜂鸣器和继电器控制函数\r
void BEEP_Relay_Control(unsigned char BEEP_state, unsigned char Relay_state)\r
{\r
    /***************开门****************/\r
    P2&=0x1F; //将P2口高三位清零\r
    P2|=0xa0; //将P27,P26设置为高电平，选择控制蜂鸣器和继电器的Y5对应的锁存器\r
    //0xA0=1010 0000\r
    /***************送“外卖”*****************/\r
    P0=0X00; //先将P0口清零\r
    if(BEEP_state==ON)\r
        P0|=0x40; //0x40=0100 0000 将P06位置高电平，控制蜂鸣器鸣叫\r
    else\r
        P0&=~0x40; //将P06位置低电平，控制蜂鸣器停止鸣叫\r
    if(Relay_state==ON)\r
        P0|=0x10; //0x10=0001 0000 将P04位置高电平，控制继电器吸合\r
    else\r
        P0&=~0x10; //将P04位置低电平，控制继电器释放\r
    /***************关门*****************/\r
    P2=P2&0x1f;\r
}`,`#include "hardware.h"\r
\r
// LED控制函数\r
void LED_Control(unsigned char state)\r
{\r
    /***************开门*****************/\r
    P2&=0x1F; //将P2口高三位清零\r
    P2|=0x80; //将P27设置为高电平P26,P25为低电平，选择控制LED的Y4对应的锁存器\r
    //0x80=1000 0000\r
    /****************送“外卖”*****************/\r
    P0 = state; //将state的值送到P0口\r
     /***************关门*****************/\r
    P2&=0x1F; //将P2口高三位清零\r
}\r
\r
// 蜂鸣器和继电器控制函数\r
void BEEP_Relay_Control(unsigned char BEEP_state, unsigned char Relay_state)\r
{\r
    /***************开门****************/\r
    P2&=0x1F; //将P2口高三位清零\r
    P2|=0xa0; //将P27,P26设置为高电平，选择控制蜂鸣器和继电器的Y5对应的锁存器\r
    //0xA0=1010 0000\r
    /***************送“外卖”*****************/\r
    P0=0X00; //先将P0口清零\r
    if(BEEP_state==ON)\r
        P0|=0x40; //0x40=0100 0000 将P06位置高电平，控制蜂鸣器鸣叫\r
    else\r
        P0&=~0x40; //将P06位置低电平，控制蜂鸣器停止鸣叫\r
    if(Relay_state==ON)\r
        P0|=0x10; //0x10=0001 0000 将P04位置高电平，控制继电器吸合\r
    else\r
        P0&=~0x10; //将P04位置低电平，控制继电器释放\r
    /***************关门*****************/\r
    P2=P2&0x1f;\r
}`,`#include <STC15F2K60S2.H>\r
#include "hardware.h"\r
#include "intrins.h"\r
\r
void Delay500ms(void)	//@12.000MHz\r
{\r
	unsigned char data i, j, k;\r
\r
	_nop_();\r
	_nop_();\r
	i = 23;\r
	j = 205;\r
	k = 120;\r
	do\r
	{\r
		do\r
		{\r
			while (--k);\r
		} while (--j);\r
	} while (--i);\r
}\r
\r
unsigned char LED_State = 0xFF; //LED状态变量\r
unsigned char BEEP_State = OFF; //蜂鸣器状态变量\r
unsigned char Relay_State = OFF; //继电器状态变量\r
int i = 0;\r
\r
int time1s=0;\r
\r
void Timer0_Init(void)		//1毫秒@12.000MHz\r
{\r
	AUXR &= 0x7F;			//定时器时钟12T模式\r
	TMOD &= 0xF0;			//设置定时器模式\r
	TL0 = 0x18;				//设置定时初始值\r
	TH0 = 0xFC;				//设置定时初始值\r
	TF0 = 0;				//清除TF0标志\r
	TR0 = 1;				//定时器0开始计时\r
	EA=1;				    //打开总中断\r
	ET0 = 1;				//使能定时器0中断\r
}\r
\r
\r
\r
void main(void)\r
{\r
	Timer0_Init();\r
    while(1)\r
    {\r
        for(i=0;i<9;i++)\r
        {\r
            LED_State&=(0xff<<i); //依次点亮LED\r
            LED_Control(LED_State); //调用LED控制函数\r
//            if(i%2==0) //当i为偶数时，蜂鸣器开启，继电器关闭\r
//            {\r
//                BEEP_State=ON; //蜂鸣器开启\r
//                Relay_State=OFF; //继电器关闭\r
//            }\r
//            else //当i为奇数时，蜂鸣器关闭，继电器开启\r
//            {\r
//                BEEP_State=OFF; //蜂鸣器关闭\r
//                Relay_State=ON; //继电器开启\r
//            }\r
//            BEEP_Relay_Control(BEEP_State, Relay_State); //蜂鸣器开启，继电器关闭\r
            Delay500ms(); //延时500毫秒\r
        }\r
        for(i=0;i<9;i++)\r
        {\r
            LED_State|=~(0xff>>i); //依次熄灭LED\r
            LED_Control(LED_State); //调用LED控制函数\r
//            if(i%2==0) //当i为偶数时，蜂鸣器开启，继电器关闭\r
//            {\r
//                BEEP_State=OFF; //蜂鸣器开启\r
//                Relay_State=ON; //继电器关闭\r
//            }\r
//            else //当i为奇数时，蜂鸣器关闭，继电器开启\r
//            {\r
//                BEEP_State=ON; //蜂鸣器关闭\r
//                Relay_State=OFF; //继电器开启\r
//            }\r
//            BEEP_Relay_Control(BEEP_State, Relay_State); //蜂鸣器开启，继电器关闭\r
            Delay500ms(); //延时500毫秒\r
        }\r
    }\r
}\r
bit beep_relay_flag=0;\r
void Timer0_Isr(void) interrupt 1\r
{\r
	if(time1s++>=1000)\r
	{\r
		if(beep_relay_flag == 0)\r
		{\r
			BEEP_State=ON; //蜂鸣器开启\r
            Relay_State=OFF; //继电器关闭\r
			BEEP_Relay_Control(BEEP_State, Relay_State); //蜂鸣器开启，继电器关闭\r
			beep_relay_flag = 1;\r
		}\r
		else if(beep_relay_flag == 1)\r
		{\r
			BEEP_State=OFF; //蜂鸣器关闭\r
            Relay_State=ON; //继电器开启\r
			BEEP_Relay_Control(BEEP_State, Relay_State); //蜂鸣器关闭，继电器开启\r
			beep_relay_flag = 0;\r
		}\r
		time1s=0;\r
	}\r
		\r
}\r
\r
\r
`,`#include <STC15F2K60S2.H>\r
#include "hardware.h"\r
#include "intrins.h"\r
\r
void Delay500ms(void)	//@12.000MHz\r
{\r
	unsigned char data i, j, k;\r
\r
	_nop_();\r
	_nop_();\r
	i = 23;\r
	j = 205;\r
	k = 120;\r
	do\r
	{\r
		do\r
		{\r
			while (--k);\r
		} while (--j);\r
	} while (--i);\r
}\r
\r
unsigned char LED_State = 0xFF; //LED状态变量\r
unsigned char BEEP_State = OFF; //蜂鸣器状态变量\r
unsigned char Relay_State = OFF; //继电器状态变量\r
int i = 0;\r
void main(void)\r
{\r
    while(1)\r
    {\r
        for(i=0;i<9;i++)\r
        {\r
            LED_State&=(0xff<<i); //依次点亮LED\r
            LED_Control(LED_State); //调用LED控制函数\r
            if(i%2==0) //当i为偶数时，蜂鸣器开启，继电器关闭\r
            {\r
                BEEP_State=ON; //蜂鸣器开启\r
                Relay_State=OFF; //继电器关闭\r
            }\r
            else //当i为奇数时，蜂鸣器关闭，继电器开启\r
            {\r
                BEEP_State=OFF; //蜂鸣器关闭\r
                Relay_State=ON; //继电器开启\r
            }\r
            BEEP_Relay_Control(BEEP_State, Relay_State); //蜂鸣器开启，继电器关闭\r
            Delay500ms(); //延时500毫秒\r
        }\r
        for(i=0;i<9;i++)\r
        {\r
            LED_State|=~(0xff>>i); //依次熄灭LED\r
            LED_Control(LED_State); //调用LED控制函数\r
            if(i%2==0) //当i为偶数时，蜂鸣器开启，继电器关闭\r
            {\r
                BEEP_State=OFF; //蜂鸣器开启\r
                Relay_State=ON; //继电器关闭\r
            }\r
            else //当i为奇数时，蜂鸣器关闭，继电器开启\r
            {\r
                BEEP_State=ON; //蜂鸣器关闭\r
                Relay_State=OFF; //继电器开启\r
            }\r
            BEEP_Relay_Control(BEEP_State, Relay_State); //蜂鸣器开启，继电器关闭\r
            Delay500ms(); //延时500毫秒\r
        }\r
    }\r
}\r
`,`#include <STC15F2K60S2.H>\r
#include "hardware.h"\r
#include "intrins.h"\r
\r
volatile unsigned char LED_State = 0xFF;  // LED状态在ISR中使用，需volatile\r
volatile unsigned char beep_state = OFF;  // 蜂鸣器状态在ISR中使用，需volatile\r
volatile unsigned char relay_state = OFF; // 继电器状态在ISR中使用，需volatile\r
\r
// 使用事件标志替代多字节计数器，避免主循环与ISR的非原子读写\r
volatile unsigned char tick_250ms = 0;\r
volatile unsigned char tick_500ms = 0;\r
volatile unsigned char tick_1s = 0;\r
\r
void Timer0_Init(void) // 1毫秒@12.000MHz\r
{\r
	AUXR &= 0x7F; // 定时器时钟12T模式\r
	TMOD &= 0xF0; // 设置定时器模式\r
	TL0 = 0x18;	  // 设置定时初始值\r
	TH0 = 0xFC;	  // 设置定时初始值\r
	TF0 = 0;	  // 清除TF0标志\r
	TR0 = 1;	  // 定时器0开始计时\r
	EA = 1;		  // 打开总中断\r
	ET0 = 1;	  // 使能定时器0中断\r
}\r
\r
unsigned char led_time = 0;\r
unsigned char led_flag = 0;\r
\r
void main(void)\r
{\r
	Timer0_Init();\r
	while (1)\r
	{\r
		// 1s事件：切换蜂鸣器\r
		if (tick_1s)\r
		{\r
			tick_1s = 0;\r
			beep_state = !beep_state; // 简化切换\r
		}\r
\r
		// 500ms事件：切换继电器\r
		if (tick_500ms)\r
		{\r
			tick_500ms = 0;\r
			relay_state = !relay_state; // 简化切换\r
		}\r
\r
		// 250ms事件：更新LED动画\r
		if (tick_250ms)\r
		{\r
			tick_250ms = 0;\r
			if (led_time++ >= 8)\r
			{\r
				led_time = 0;\r
				led_flag = !led_flag;\r
			}\r
			if (led_flag)\r
				LED_State |= ~(0xFF >> led_time); // 依次熄灭LED\r
			else\r
				LED_State &= (0xFF << led_time); // 依次点亮LED\r
		}\r
	}\r
}\r
\r
void Timer0_Isr(void) interrupt 1 // 中断程序\r
{\r
	// 用静态毫秒累加器触发事件标志，避免主循环读写多字节计数器\r
	static unsigned int acc250 = 0, acc500 = 0, acc1000 = 0;\r
\r
	acc250++;\r
	acc500++;\r
	acc1000++;\r
\r
	if (acc250 >= 250)\r
	{\r
		acc250 = 0;\r
		tick_250ms = 1;\r
	}\r
	if (acc500 >= 500)\r
	{\r
		acc500 = 0;\r
		tick_500ms = 1;\r
	}\r
	if (acc1000 >= 1000)\r
	{\r
		acc1000 = 0;\r
		tick_1s = 1;\r
	}\r
\r
	LED_Control(LED_State);\r
	BEEP_Relay_Control(beep_state, relay_state);\r
}\r
`,`#ifndef __OLED_FONT_H\r
#define __OLED_FONT_H\r
\r
/*OLED字模库，宽8像素，高16像素*/\r
const unsigned char code OLED_F8x16[][16]=\r
{\r
	0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,\r
	0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,//  0\r
	\r
	0x00,0x00,0x00,0xF8,0x00,0x00,0x00,0x00,\r
	0x00,0x00,0x00,0x33,0x30,0x00,0x00,0x00,//! 1\r
	\r
	0x00,0x10,0x0C,0x06,0x10,0x0C,0x06,0x00,\r
	0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,//" 2\r
	\r
	0x40,0xC0,0x78,0x40,0xC0,0x78,0x40,0x00,\r
	0x04,0x3F,0x04,0x04,0x3F,0x04,0x04,0x00,//# 3\r
	\r
	0x00,0x70,0x88,0xFC,0x08,0x30,0x00,0x00,\r
	0x00,0x18,0x20,0xFF,0x21,0x1E,0x00,0x00,//$ 4\r
	\r
	0xF0,0x08,0xF0,0x00,0xE0,0x18,0x00,0x00,\r
	0x00,0x21,0x1C,0x03,0x1E,0x21,0x1E,0x00,//% 5\r
	\r
	0x00,0xF0,0x08,0x88,0x70,0x00,0x00,0x00,\r
	0x1E,0x21,0x23,0x24,0x19,0x27,0x21,0x10,//& 6\r
	\r
	0x10,0x16,0x0E,0x00,0x00,0x00,0x00,0x00,\r
	0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,//' 7\r
	\r
	0x00,0x00,0x00,0xE0,0x18,0x04,0x02,0x00,\r
	0x00,0x00,0x00,0x07,0x18,0x20,0x40,0x00,//( 8\r
	\r
	0x00,0x02,0x04,0x18,0xE0,0x00,0x00,0x00,\r
	0x00,0x40,0x20,0x18,0x07,0x00,0x00,0x00,//) 9\r
	\r
	0x40,0x40,0x80,0xF0,0x80,0x40,0x40,0x00,\r
	0x02,0x02,0x01,0x0F,0x01,0x02,0x02,0x00,//* 10\r
	\r
	0x00,0x00,0x00,0xF0,0x00,0x00,0x00,0x00,\r
	0x01,0x01,0x01,0x1F,0x01,0x01,0x01,0x00,//+ 11\r
	\r
	0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,\r
	0x80,0xB0,0x70,0x00,0x00,0x00,0x00,0x00,//, 12\r
	\r
	0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,\r
	0x00,0x01,0x01,0x01,0x01,0x01,0x01,0x01,//- 13\r
	\r
	0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,\r
	0x00,0x30,0x30,0x00,0x00,0x00,0x00,0x00,//. 14\r
	\r
	0x00,0x00,0x00,0x00,0x80,0x60,0x18,0x04,\r
	0x00,0x60,0x18,0x06,0x01,0x00,0x00,0x00,/// 15\r
	\r
	0x00,0xE0,0x10,0x08,0x08,0x10,0xE0,0x00,\r
	0x00,0x0F,0x10,0x20,0x20,0x10,0x0F,0x00,//0 16\r
	\r
	0x00,0x10,0x10,0xF8,0x00,0x00,0x00,0x00,\r
	0x00,0x20,0x20,0x3F,0x20,0x20,0x00,0x00,//1 17\r
	\r
	0x00,0x70,0x08,0x08,0x08,0x88,0x70,0x00,\r
	0x00,0x30,0x28,0x24,0x22,0x21,0x30,0x00,//2 18\r
	\r
	0x00,0x30,0x08,0x88,0x88,0x48,0x30,0x00,\r
	0x00,0x18,0x20,0x20,0x20,0x11,0x0E,0x00,//3 19\r
	\r
	0x00,0x00,0xC0,0x20,0x10,0xF8,0x00,0x00,\r
	0x00,0x07,0x04,0x24,0x24,0x3F,0x24,0x00,//4 20\r
	\r
	0x00,0xF8,0x08,0x88,0x88,0x08,0x08,0x00,\r
	0x00,0x19,0x21,0x20,0x20,0x11,0x0E,0x00,//5 21\r
	\r
	0x00,0xE0,0x10,0x88,0x88,0x18,0x00,0x00,\r
	0x00,0x0F,0x11,0x20,0x20,0x11,0x0E,0x00,//6 22\r
	\r
	0x00,0x38,0x08,0x08,0xC8,0x38,0x08,0x00,\r
	0x00,0x00,0x00,0x3F,0x00,0x00,0x00,0x00,//7 23\r
	\r
	0x00,0x70,0x88,0x08,0x08,0x88,0x70,0x00,\r
	0x00,0x1C,0x22,0x21,0x21,0x22,0x1C,0x00,//8 24\r
	\r
	0x00,0xE0,0x10,0x08,0x08,0x10,0xE0,0x00,\r
	0x00,0x00,0x31,0x22,0x22,0x11,0x0F,0x00,//9 25\r
	\r
	0x00,0x00,0x00,0xC0,0xC0,0x00,0x00,0x00,\r
	0x00,0x00,0x00,0x30,0x30,0x00,0x00,0x00,//: 26\r
	\r
	0x00,0x00,0x00,0x80,0x00,0x00,0x00,0x00,\r
	0x00,0x00,0x80,0x60,0x00,0x00,0x00,0x00,//; 27\r
	\r
	0x00,0x00,0x80,0x40,0x20,0x10,0x08,0x00,\r
	0x00,0x01,0x02,0x04,0x08,0x10,0x20,0x00,//< 28\r
	\r
	0x40,0x40,0x40,0x40,0x40,0x40,0x40,0x00,\r
	0x04,0x04,0x04,0x04,0x04,0x04,0x04,0x00,//= 29\r
	\r
	0x00,0x08,0x10,0x20,0x40,0x80,0x00,0x00,\r
	0x00,0x20,0x10,0x08,0x04,0x02,0x01,0x00,//> 30\r
	\r
	0x00,0x70,0x48,0x08,0x08,0x08,0xF0,0x00,\r
	0x00,0x00,0x00,0x30,0x36,0x01,0x00,0x00,//? 31\r
	\r
	0xC0,0x30,0xC8,0x28,0xE8,0x10,0xE0,0x00,\r
	0x07,0x18,0x27,0x24,0x23,0x14,0x0B,0x00,//@ 32\r
	\r
	0x00,0x00,0xC0,0x38,0xE0,0x00,0x00,0x00,\r
	0x20,0x3C,0x23,0x02,0x02,0x27,0x38,0x20,//A 33\r
	\r
	0x08,0xF8,0x88,0x88,0x88,0x70,0x00,0x00,\r
	0x20,0x3F,0x20,0x20,0x20,0x11,0x0E,0x00,//B 34\r
	\r
	0xC0,0x30,0x08,0x08,0x08,0x08,0x38,0x00,\r
	0x07,0x18,0x20,0x20,0x20,0x10,0x08,0x00,//C 35\r
	\r
	0x08,0xF8,0x08,0x08,0x08,0x10,0xE0,0x00,\r
	0x20,0x3F,0x20,0x20,0x20,0x10,0x0F,0x00,//D 36\r
	\r
	0x08,0xF8,0x88,0x88,0xE8,0x08,0x10,0x00,\r
	0x20,0x3F,0x20,0x20,0x23,0x20,0x18,0x00,//E 37\r
	\r
	0x08,0xF8,0x88,0x88,0xE8,0x08,0x10,0x00,\r
	0x20,0x3F,0x20,0x00,0x03,0x00,0x00,0x00,//F 38\r
	\r
	0xC0,0x30,0x08,0x08,0x08,0x38,0x00,0x00,\r
	0x07,0x18,0x20,0x20,0x22,0x1E,0x02,0x00,//G 39\r
	\r
	0x08,0xF8,0x08,0x00,0x00,0x08,0xF8,0x08,\r
	0x20,0x3F,0x21,0x01,0x01,0x21,0x3F,0x20,//H 40\r
	\r
	0x00,0x08,0x08,0xF8,0x08,0x08,0x00,0x00,\r
	0x00,0x20,0x20,0x3F,0x20,0x20,0x00,0x00,//I 41\r
	\r
	0x00,0x00,0x08,0x08,0xF8,0x08,0x08,0x00,\r
	0xC0,0x80,0x80,0x80,0x7F,0x00,0x00,0x00,//J 42\r
	\r
	0x08,0xF8,0x88,0xC0,0x28,0x18,0x08,0x00,\r
	0x20,0x3F,0x20,0x01,0x26,0x38,0x20,0x00,//K 43\r
	\r
	0x08,0xF8,0x08,0x00,0x00,0x00,0x00,0x00,\r
	0x20,0x3F,0x20,0x20,0x20,0x20,0x30,0x00,//L 44\r
	\r
	0x08,0xF8,0xF8,0x00,0xF8,0xF8,0x08,0x00,\r
	0x20,0x3F,0x00,0x3F,0x00,0x3F,0x20,0x00,//M 45\r
	\r
	0x08,0xF8,0x30,0xC0,0x00,0x08,0xF8,0x08,\r
	0x20,0x3F,0x20,0x00,0x07,0x18,0x3F,0x00,//N 46\r
	\r
	0xE0,0x10,0x08,0x08,0x08,0x10,0xE0,0x00,\r
	0x0F,0x10,0x20,0x20,0x20,0x10,0x0F,0x00,//O 47\r
	\r
	0x08,0xF8,0x08,0x08,0x08,0x08,0xF0,0x00,\r
	0x20,0x3F,0x21,0x01,0x01,0x01,0x00,0x00,//P 48\r
	\r
	0xE0,0x10,0x08,0x08,0x08,0x10,0xE0,0x00,\r
	0x0F,0x18,0x24,0x24,0x38,0x50,0x4F,0x00,//Q 49\r
	\r
	0x08,0xF8,0x88,0x88,0x88,0x88,0x70,0x00,\r
	0x20,0x3F,0x20,0x00,0x03,0x0C,0x30,0x20,//R 50\r
	\r
	0x00,0x70,0x88,0x08,0x08,0x08,0x38,0x00,\r
	0x00,0x38,0x20,0x21,0x21,0x22,0x1C,0x00,//S 51\r
	\r
	0x18,0x08,0x08,0xF8,0x08,0x08,0x18,0x00,\r
	0x00,0x00,0x20,0x3F,0x20,0x00,0x00,0x00,//T 52\r
	\r
	0x08,0xF8,0x08,0x00,0x00,0x08,0xF8,0x08,\r
	0x00,0x1F,0x20,0x20,0x20,0x20,0x1F,0x00,//U 53\r
	\r
	0x08,0x78,0x88,0x00,0x00,0xC8,0x38,0x08,\r
	0x00,0x00,0x07,0x38,0x0E,0x01,0x00,0x00,//V 54\r
	\r
	0xF8,0x08,0x00,0xF8,0x00,0x08,0xF8,0x00,\r
	0x03,0x3C,0x07,0x00,0x07,0x3C,0x03,0x00,//W 55\r
	\r
	0x08,0x18,0x68,0x80,0x80,0x68,0x18,0x08,\r
	0x20,0x30,0x2C,0x03,0x03,0x2C,0x30,0x20,//X 56\r
	\r
	0x08,0x38,0xC8,0x00,0xC8,0x38,0x08,0x00,\r
	0x00,0x00,0x20,0x3F,0x20,0x00,0x00,0x00,//Y 57\r
	\r
	0x10,0x08,0x08,0x08,0xC8,0x38,0x08,0x00,\r
	0x20,0x38,0x26,0x21,0x20,0x20,0x18,0x00,//Z 58\r
	\r
	0x00,0x00,0x00,0xFE,0x02,0x02,0x02,0x00,\r
	0x00,0x00,0x00,0x7F,0x40,0x40,0x40,0x00,//[ 59\r
	\r
	0x00,0x0C,0x30,0xC0,0x00,0x00,0x00,0x00,\r
	0x00,0x00,0x00,0x01,0x06,0x38,0xC0,0x00,//\\ 60\r
	\r
	0x00,0x02,0x02,0x02,0xFE,0x00,0x00,0x00,\r
	0x00,0x40,0x40,0x40,0x7F,0x00,0x00,0x00,//] 61\r
	\r
	0x00,0x00,0x04,0x02,0x02,0x02,0x04,0x00,\r
	0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,//^ 62\r
	\r
	0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,\r
	0x80,0x80,0x80,0x80,0x80,0x80,0x80,0x80,//_ 63\r
	\r
	0x00,0x02,0x02,0x04,0x00,0x00,0x00,0x00,\r
	0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,//\` 64\r
	\r
	0x00,0x00,0x80,0x80,0x80,0x80,0x00,0x00,\r
	0x00,0x19,0x24,0x22,0x22,0x22,0x3F,0x20,//a 65\r
	\r
	0x08,0xF8,0x00,0x80,0x80,0x00,0x00,0x00,\r
	0x00,0x3F,0x11,0x20,0x20,0x11,0x0E,0x00,//b 66\r
	\r
	0x00,0x00,0x00,0x80,0x80,0x80,0x00,0x00,\r
	0x00,0x0E,0x11,0x20,0x20,0x20,0x11,0x00,//c 67\r
	\r
	0x00,0x00,0x00,0x80,0x80,0x88,0xF8,0x00,\r
	0x00,0x0E,0x11,0x20,0x20,0x10,0x3F,0x20,//d 68\r
	\r
	0x00,0x00,0x80,0x80,0x80,0x80,0x00,0x00,\r
	0x00,0x1F,0x22,0x22,0x22,0x22,0x13,0x00,//e 69\r
	\r
	0x00,0x80,0x80,0xF0,0x88,0x88,0x88,0x18,\r
	0x00,0x20,0x20,0x3F,0x20,0x20,0x00,0x00,//f 70\r
	\r
	0x00,0x00,0x80,0x80,0x80,0x80,0x80,0x00,\r
	0x00,0x6B,0x94,0x94,0x94,0x93,0x60,0x00,//g 71\r
	\r
	0x08,0xF8,0x00,0x80,0x80,0x80,0x00,0x00,\r
	0x20,0x3F,0x21,0x00,0x00,0x20,0x3F,0x20,//h 72\r
	\r
	0x00,0x80,0x98,0x98,0x00,0x00,0x00,0x00,\r
	0x00,0x20,0x20,0x3F,0x20,0x20,0x00,0x00,//i 73\r
	\r
	0x00,0x00,0x00,0x80,0x98,0x98,0x00,0x00,\r
	0x00,0xC0,0x80,0x80,0x80,0x7F,0x00,0x00,//j 74\r
	\r
	0x08,0xF8,0x00,0x00,0x80,0x80,0x80,0x00,\r
	0x20,0x3F,0x24,0x02,0x2D,0x30,0x20,0x00,//k 75\r
	\r
	0x00,0x08,0x08,0xF8,0x00,0x00,0x00,0x00,\r
	0x00,0x20,0x20,0x3F,0x20,0x20,0x00,0x00,//l 76\r
	\r
	0x80,0x80,0x80,0x80,0x80,0x80,0x80,0x00,\r
	0x20,0x3F,0x20,0x00,0x3F,0x20,0x00,0x3F,//m 77\r
	\r
	0x80,0x80,0x00,0x80,0x80,0x80,0x00,0x00,\r
	0x20,0x3F,0x21,0x00,0x00,0x20,0x3F,0x20,//n 78\r
	\r
	0x00,0x00,0x80,0x80,0x80,0x80,0x00,0x00,\r
	0x00,0x1F,0x20,0x20,0x20,0x20,0x1F,0x00,//o 79\r
	\r
	0x80,0x80,0x00,0x80,0x80,0x00,0x00,0x00,\r
	0x80,0xFF,0xA1,0x20,0x20,0x11,0x0E,0x00,//p 80\r
	\r
	0x00,0x00,0x00,0x80,0x80,0x80,0x80,0x00,\r
	0x00,0x0E,0x11,0x20,0x20,0xA0,0xFF,0x80,//q 81\r
	\r
	0x80,0x80,0x80,0x00,0x80,0x80,0x80,0x00,\r
	0x20,0x20,0x3F,0x21,0x20,0x00,0x01,0x00,//r 82\r
	\r
	0x00,0x00,0x80,0x80,0x80,0x80,0x80,0x00,\r
	0x00,0x33,0x24,0x24,0x24,0x24,0x19,0x00,//s 83\r
	\r
	0x00,0x80,0x80,0xE0,0x80,0x80,0x00,0x00,\r
	0x00,0x00,0x00,0x1F,0x20,0x20,0x00,0x00,//t 84\r
	\r
	0x80,0x80,0x00,0x00,0x00,0x80,0x80,0x00,\r
	0x00,0x1F,0x20,0x20,0x20,0x10,0x3F,0x20,//u 85\r
	\r
	0x80,0x80,0x80,0x00,0x00,0x80,0x80,0x80,\r
	0x00,0x01,0x0E,0x30,0x08,0x06,0x01,0x00,//v 86\r
	\r
	0x80,0x80,0x00,0x80,0x00,0x80,0x80,0x80,\r
	0x0F,0x30,0x0C,0x03,0x0C,0x30,0x0F,0x00,//w 87\r
	\r
	0x00,0x80,0x80,0x00,0x80,0x80,0x80,0x00,\r
	0x00,0x20,0x31,0x2E,0x0E,0x31,0x20,0x00,//x 88\r
	\r
	0x80,0x80,0x80,0x00,0x00,0x80,0x80,0x80,\r
	0x80,0x81,0x8E,0x70,0x18,0x06,0x01,0x00,//y 89\r
	\r
	0x00,0x80,0x80,0x80,0x80,0x80,0x80,0x00,\r
	0x00,0x21,0x30,0x2C,0x22,0x21,0x30,0x00,//z 90\r
	\r
	0x00,0x00,0x00,0x00,0x80,0x7C,0x02,0x02,\r
	0x00,0x00,0x00,0x00,0x00,0x3F,0x40,0x40,//{ 91\r
	\r
	0x00,0x00,0x00,0x00,0xFF,0x00,0x00,0x00,\r
	0x00,0x00,0x00,0x00,0xFF,0x00,0x00,0x00,//| 92\r
	\r
	0x00,0x02,0x02,0x7C,0x80,0x00,0x00,0x00,\r
	0x00,0x40,0x40,0x3F,0x00,0x00,0x00,0x00,//} 93\r
	\r
	0x00,0x06,0x01,0x01,0x02,0x02,0x04,0x04,\r
	0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,//~ 94\r
};\r
\r
#endif\r
`,`#ifndef __HARDWARE_H__\r
#define __HARDWARE_H__\r
\r
#include <STC15F2K60S2.H>\r
\r
// BEEP,Relay状态定义\r
#define ON     1    \r
#define OFF    0\r
\r
void LED_Control(unsigned char state);\r
void BEEP_Relay_Control(unsigned char BEEP_state, unsigned char Relay_state);\r
\r
\r
#endif`,`#ifndef __HARDWARE_H__\r
#define __HARDWARE_H__\r
\r
#include <STC15F2K60S2.H>\r
\r
// BEEP,Relay状态定义\r
#define ON     1    \r
#define OFF    0\r
\r
void LED_Control(unsigned char state);\r
void BEEP_Relay_Control(unsigned char BEEP_state, unsigned char Relay_state);\r
\r
\r
#endif`,`version: "4.1"
name: main
type: C51
deviceName: null
packDir: null
srcDirs: []
virtualFolder:
  name: <virtual_root>
  files: []
  folders:
    - name: user
      files:
        - path: ../STARTUP.A51
        - path: ../user/main.c
      folders: []
    - name: driver
      files:
        - path: ../driver/hardware.c
      folders: []
dependenceList: []
outDir: build
miscInfo:
  uid: 7f7074a2d4fd45d54a47d293afccedc5
targets:
  Target 1:
    cppPreprocessAttrs:
      defineList: []
      incList:
        - d:/KEIL_MDK/mdk/C51/INC/STC
        - ../user
        - ../driver
      libList: []
    excludeList: []
    toolchain: Keil_C51
    toolchainConfigMap:
      Keil_C51:
        options:
          version: 2
          afterBuildTasks: []
          asm-compiler: {}
          beforeBuildTasks: []
          c/cpp-compiler:
            optimization-level: level-8
            optimization-type: SPEED
          global:
            ram-mode: SMALL
            rom-mode: LARGE
          linker:
            misc-controls: ""
            output-format: elf
            remove-unused: true
    uploadConfigMap:
      Custom:
        bin: ""
        commandLine: ""
        eraseChipCommand: ""
      stcgal:
        bin: ""
        eepromImgPath: "null"
        extraOptions: ""
        options: .eide/stc.flash.json
    uploader: stcgal
`,`version: "4.1"
name: main
type: C51
deviceName: null
packDir: null
srcDirs: []
virtualFolder:
  name: <virtual_root>
  files: []
  folders:
    - name: user
      files:
        - path: ../STARTUP.A51
        - path: ../user/main.c
      folders: []
    - name: driver
      files:
        - path: ../driver/hardware.c
      folders: []
dependenceList: []
outDir: build
miscInfo:
  uid: 7f7074a2d4fd45d54a47d293afccedc5
targets:
  Target 1:
    cppPreprocessAttrs:
      defineList: []
      incList:
        - d:/KEIL_MDK/mdk/C51/INC/STC
        - ../user
        - ../driver
      libList: []
    excludeList: []
    toolchain: Keil_C51
    toolchainConfigMap:
      Keil_C51:
        options:
          version: 2
          afterBuildTasks: []
          asm-compiler: {}
          beforeBuildTasks: []
          c/cpp-compiler:
            optimization-level: level-8
            optimization-type: SPEED
          global:
            ram-mode: SMALL
            rom-mode: LARGE
          linker:
            misc-controls: ""
            output-format: elf
            remove-unused: true
    uploadConfigMap:
      Custom:
        bin: ""
        commandLine: ""
        eraseChipCommand: ""
      stcgal:
        bin: ""
        eepromImgPath: "null"
        extraOptions: ""
        options: .eide/stc.flash.json
    uploader: stcgal
`,`#ifndef __OLED_H\r
#define __OLED_H\r
\r
void OLED_Init(void);\r
void OLED_Clear(void);\r
void OLED_ShowChar(unsigned char Line, unsigned char Column, char Char);\r
void OLED_ShowString(unsigned char Line, unsigned char Column, char *String);\r
void OLED_ShowNum(unsigned char Line, unsigned char Column, unsigned int Number, unsigned char Length);\r
void OLED_ShowSignedNum(unsigned char Line, unsigned char Column, int Number, unsigned char Length);\r
void OLED_ShowHexNum(unsigned char Line, unsigned char Column, unsigned int Number, unsigned char Length);\r
void OLED_ShowBinNum(unsigned char Line, unsigned char Column, unsigned int Number, unsigned char Length);\r
\r
#endif\r
`,`#ifndef __HARDWARE_H__\r
#define __HARDWARE_H__\r
\r
#include <STC15F2K60S2.H>\r
\r
// BEEP,Relay状态定义\r
#define ON     1    \r
#define OFF    0\r
\r
void LED_Control(unsigned char state);\r
void BEEP_Relay_Control(unsigned char BEEP_state, unsigned char Relay_state);\r
\r
\r
#endif`,`##########################################################################################\r
#                        Append Compiler Options For Source Files\r
##########################################################################################\r
\r
# syntax:\r
#   <your pattern>: <compiler options>\r
# For get pattern syntax, please refer to: https://www.npmjs.com/package/micromatch\r
#\r
# examples:\r
#   'main.cpp':           --cpp11 -Og ...\r
#   'src/*.c':            -gnu -O2 ...\r
#   'src/lib/**/*.cpp':   --cpp11 -Os ...\r
#   '!Application/*.c':   -O0\r
#   '**/*.c':             -O2 -gnu ...\r
\r
version: "2.1"
options:
    Target 1:
        files: {}
        virtualPathFiles: {}
`];return(G,r)=>(o(),s("div",null,[r[19]||(r[19]=n("h1",{id:"_51单片机基础练习源码",tabindex:"-1"},[e("51单片机基础练习源码 "),n("a",{class:"header-anchor",href:"#_51单片机基础练习源码","aria-label":'Permalink to "51单片机基础练习源码"'},"​")],-1)),r[20]||(r[20]=n("div",{class:"kb-file-meta"},[n("span",null,[n("strong",null,"目录"),e("嵌入式 / 51单片机 / 基础练习")]),n("span",null,[n("strong",null,"格式"),e("ZIP")]),n("span",null,[n("strong",null,"大小"),e("33.3 KB")])],-1)),n("p",u,[n("a",{class:"kb-download-button kb-download-button-secondary",href:d(i),download:""},"下载完整源码包",8,E)]),r[21]||(r[21]=n("h2",{id:"在线预览",tabindex:"-1"},[e("在线预览 "),n("a",{class:"header-anchor",href:"#在线预览","aria-label":'Permalink to "在线预览"'},"​")],-1)),r[22]||(r[22]=n("div",{class:"kb-preview-summary"},[n("span",null,[n("strong",null,"28"),e(" 个文件")]),n("span",null,[n("strong",null,"14"),e(" 个目录")]),n("span",null,[n("strong",null,"112.2 KB"),e(" 解压后大小")])],-1)),n("div",m,[r[18]||(r[18]=_("",1)),n("details",{class:"kb-preview-panel kb-archive-index"},[r[0]||(r[0]=n("summary",null,"查看完整目录 · 28 个文件",-1)),n("pre",{textContent:a})]),n("section",C,[r[17]||(r[17]=n("h3",{id:"doc-fdb02902fe-source-heading"},"可读文件预览",-1)),n("details",c,[r[1]||(r[1]=n("summary",null,[n("span",null,"README.txt"),n("small",null,"308 B")],-1)),n("pre",null,[n("code",{textContent:t(x[0])},null,8,p)])]),n("details",L,[r[2]||(r[2]=n("summary",null,[n("span",null,"51_oled/oled.c"),n("small",null,"7.3 KB")],-1)),n("pre",null,[n("code",{textContent:t(x[1])},null,8,h)])]),n("details",F,[r[3]||(r[3]=n("summary",null,[n("span",null,"led_beep_relay_time/driver/hardware.c"),n("small",null,"1.2 KB")],-1)),n("pre",null,[n("code",{textContent:t(x[2])},null,8,D)])]),n("details",g,[r[4]||(r[4]=n("summary",null,[n("span",null,"led_beep_relay/driver/hardware.c"),n("small",null,"1.2 KB")],-1)),n("pre",null,[n("code",{textContent:t(x[3])},null,8,v)])]),n("details",O,[r[5]||(r[5]=n("summary",null,[n("span",null,"Round_Robin/driver/hardware.c"),n("small",null,"1.2 KB")],-1)),n("pre",null,[n("code",{textContent:t(x[4])},null,8,f)])]),n("details",b,[r[6]||(r[6]=n("summary",null,[n("span",null,"led_beep_relay_time/user/main.c"),n("small",null,"2.6 KB")],-1)),n("pre",null,[n("code",{textContent:t(x[5])},null,8,P)])]),n("details",S,[r[7]||(r[7]=n("summary",null,[n("span",null,"led_beep_relay/user/main.c"),n("small",null,"1.7 KB")],-1)),n("pre",null,[n("code",{textContent:t(x[6])},null,8,y)])]),n("details",B,[r[8]||(r[8]=n("summary",null,[n("span",null,"Round_Robin/user/main.c"),n("small",null,"1.9 KB")],-1)),n("pre",null,[n("code",{textContent:t(x[7])},null,8,R)])]),n("details",w,[r[9]||(r[9]=n("summary",null,[n("span",null,"51_oled/OLED_Font.h"),n("small",null,"9.0 KB")],-1)),n("pre",null,[n("code",{textContent:t(x[8])},null,8,k)])]),n("details",A,[r[10]||(r[10]=n("summary",null,[n("span",null,"led_beep_relay_time/driver/hardware.h"),n("small",null,"273 B")],-1)),n("pre",null,[n("code",{textContent:t(x[9])},null,8,N)])]),n("details",I,[r[11]||(r[11]=n("summary",null,[n("span",null,"led_beep_relay/driver/hardware.h"),n("small",null,"273 B")],-1)),n("pre",null,[n("code",{textContent:t(x[10])},null,8,T)])]),n("details",W,[r[12]||(r[12]=n("summary",null,[n("span",null,"led_beep_relay_time/vscode/.eide/eide.yml"),n("small",null,"1.3 KB")],-1)),n("pre",null,[n("code",{textContent:t(x[11])},null,8,K)])]),n("details",H,[r[13]||(r[13]=n("summary",null,[n("span",null,"Round_Robin/vscode/.eide/eide.yml"),n("small",null,"1.3 KB")],-1)),n("pre",null,[n("code",{textContent:t(x[12])},null,8,j)])]),n("details",M,[r[14]||(r[14]=n("summary",null,[n("span",null,"51_oled/oled.h"),n("small",null,"671 B")],-1)),n("pre",null,[n("code",{textContent:t(x[13])},null,8,X)])]),n("details",Y,[r[15]||(r[15]=n("summary",null,[n("span",null,"Round_Robin/driver/hardware.h"),n("small",null,"273 B")],-1)),n("pre",null,[n("code",{textContent:t(x[14])},null,8,U)])]),n("details",z,[r[16]||(r[16]=n("summary",null,[n("span",null,"led_beep_relay_time/vscode/.eide/files.options.yml"),n("small",null,"689 B")],-1)),n("pre",null,[n("code",{textContent:t(x[15])},null,8,V)])])])])]))}});export{Q as __pageData,$ as default};
