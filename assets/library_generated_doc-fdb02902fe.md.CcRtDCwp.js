import{g as o,o as s,c as _,j as n,a as t,k as d,a6 as u,t as a}from"./chunks/framework.tKDuW4U2.js";const m={class:"kb-download-actions"},E=["href"],L={class:"kb-archive-preview"},C={class:"kb-source-previews","aria-labelledby":"doc-fdb02902fe-source-heading"},D={class:"kb-preview-panel kb-code-preview",open:""},p=["textContent"],h={class:"kb-preview-panel kb-code-preview"},O=["textContent"],P={class:"kb-preview-panel kb-code-preview"},b=["textContent"],g={class:"kb-preview-panel kb-code-preview"},c=["textContent"],x={class:"kb-preview-panel kb-code-preview"},S=["textContent"],v={class:"kb-preview-panel kb-code-preview"},B=["textContent"],F=JSON.parse('{"title":"51单片机基础练习源码","description":"嵌入式 / 51单片机 / 基础练习 · ZIP · 33.3 KB","frontmatter":{"search":false,"aside":false,"pageClass":"kb-wide-document","title":"51单片机基础练习源码","description":"嵌入式 / 51单片机 / 基础练习 · ZIP · 33.3 KB","searchTitle":"51单片机基础练习源码","searchPath":"嵌入式 / 51单片机 / 基础练习","searchType":"ZIP"},"headers":[],"relativePath":"library/generated/doc-fdb02902fe.md","filePath":"library/generated/doc-fdb02902fe.md","lastUpdated":null}'),f={name:"library/generated/doc-fdb02902fe.md"},A=Object.assign(f,{setup(y){const i=o("/uploads/raw/%E5%B5%8C%E5%85%A5%E5%BC%8F/02-51%E5%8D%95%E7%89%87%E6%9C%BA/%E5%9F%BA%E7%A1%80%E7%BB%83%E4%B9%A0/51%E5%8D%95%E7%89%87%E6%9C%BA%E5%9F%BA%E7%A1%80%E7%BB%83%E4%B9%A0%E6%BA%90%E7%A0%81.zip"),l=`   9.0 KB  51_oled/OLED_Font.h
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
     50 B  Round_Robin/vscode/.eide/stc.flash.json`,e=[`51单片机基础练习源码

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
`];return(w,r)=>(s(),_("div",null,[r[9]||(r[9]=n("h1",{id:"_51单片机基础练习源码",tabindex:"-1"},[t("51单片机基础练习源码 "),n("a",{class:"header-anchor",href:"#_51单片机基础练习源码","aria-label":'Permalink to "51单片机基础练习源码"'},"​")],-1)),r[10]||(r[10]=n("div",{class:"kb-file-meta"},[n("span",null,[n("strong",null,"目录"),t("嵌入式 / 51单片机 / 基础练习")]),n("span",null,[n("strong",null,"格式"),t("ZIP")]),n("span",null,[n("strong",null,"大小"),t("33.3 KB")])],-1)),n("p",m,[n("a",{class:"kb-download-button kb-download-button-secondary",href:d(i),download:""},"下载完整源码包",8,E)]),r[11]||(r[11]=n("h2",{id:"在线预览",tabindex:"-1"},[t("在线预览 "),n("a",{class:"header-anchor",href:"#在线预览","aria-label":'Permalink to "在线预览"'},"​")],-1)),r[12]||(r[12]=n("div",{class:"kb-preview-summary"},[n("span",null,[n("strong",null,"28"),t(" 个文件")]),n("span",null,[n("strong",null,"14"),t(" 个目录")]),n("span",null,[n("strong",null,"112.2 KB"),t(" 解压后大小")])],-1)),n("div",L,[r[8]||(r[8]=u('<div class="kb-extension-list" aria-label="文件类型统计"><span><strong>C</strong>7</span><span><strong>H</strong>5</span><span><strong>YML</strong>4</span><span><strong>UVOPT</strong>3</span><span><strong>UVPROJ</strong>3</span><span><strong>A51</strong>3</span><span><strong>JSON</strong>2</span><span><strong>TXT</strong>1</span></div>',1)),n("details",{class:"kb-preview-panel kb-archive-index"},[r[0]||(r[0]=n("summary",null,"查看完整目录 · 28 个文件",-1)),n("pre",{textContent:l})]),n("section",C,[r[7]||(r[7]=n("h3",{id:"doc-fdb02902fe-source-heading"},"可读文件预览",-1)),n("details",D,[r[1]||(r[1]=n("summary",null,[n("span",null,"README.txt"),n("small",null,"308 B")],-1)),n("pre",null,[n("code",{textContent:a(e[0])},null,8,p)])]),n("details",h,[r[2]||(r[2]=n("summary",null,[n("span",null,"51_oled/oled.c"),n("small",null,"7.3 KB")],-1)),n("pre",null,[n("code",{textContent:a(e[1])},null,8,O)])]),n("details",P,[r[3]||(r[3]=n("summary",null,[n("span",null,"led_beep_relay_time/driver/hardware.c"),n("small",null,"1.2 KB")],-1)),n("pre",null,[n("code",{textContent:a(e[2])},null,8,b)])]),n("details",g,[r[4]||(r[4]=n("summary",null,[n("span",null,"led_beep_relay/driver/hardware.c"),n("small",null,"1.2 KB")],-1)),n("pre",null,[n("code",{textContent:a(e[3])},null,8,c)])]),n("details",x,[r[5]||(r[5]=n("summary",null,[n("span",null,"Round_Robin/driver/hardware.c"),n("small",null,"1.2 KB")],-1)),n("pre",null,[n("code",{textContent:a(e[4])},null,8,S)])]),n("details",v,[r[6]||(r[6]=n("summary",null,[n("span",null,"led_beep_relay_time/user/main.c"),n("small",null,"2.6 KB")],-1)),n("pre",null,[n("code",{textContent:a(e[5])},null,8,B)])])])])]))}});export{F as __pageData,A as default};
