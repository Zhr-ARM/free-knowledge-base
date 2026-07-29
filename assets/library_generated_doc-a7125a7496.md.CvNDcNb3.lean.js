import{g as u,o as s,c as l,j as n,a as e,k as o,a2 as d,t}from"./chunks/framework.BWuWLRhz.js";const _={class:"kb-download-actions"},m=["href"],E={class:"kb-archive-preview"},C={class:"kb-source-previews","aria-labelledby":"doc-a7125a7496-source-heading"},p={class:"kb-preview-panel kb-code-preview",open:""},c=["textContent"],D={class:"kb-preview-panel kb-code-preview"},h=["textContent"],L={class:"kb-preview-panel kb-code-preview"},F=["textContent"],g={class:"kb-preview-panel kb-code-preview"},O=["textContent"],f={class:"kb-preview-panel kb-code-preview"},v=["textContent"],b={class:"kb-preview-panel kb-code-preview"},S=["textContent"],T={class:"kb-preview-panel kb-code-preview"},y=["textContent"],w={class:"kb-preview-panel kb-code-preview"},k=["textContent"],A={class:"kb-preview-panel kb-code-preview"},I=["textContent"],H={class:"kb-preview-panel kb-code-preview"},B=["textContent"],P={class:"kb-preview-panel kb-code-preview"},W=["textContent"],N={class:"kb-preview-panel kb-code-preview"},M=["textContent"],R={class:"kb-preview-panel kb-code-preview"},K=["textContent"],z=JSON.parse('{"title":"STC89C51项目源码","description":"","frontmatter":{"search":false},"headers":[],"relativePath":"library/generated/doc-a7125a7496.md","filePath":"library/generated/doc-a7125a7496.md","lastUpdated":null}'),j={name:"library/generated/doc-a7125a7496.md"},Y=Object.assign(j,{setup(V){const i=u("/uploads/raw/%E5%B5%8C%E5%85%A5%E5%BC%8F/02-51%E5%8D%95%E7%89%87%E6%9C%BA/%E5%9F%BA%E7%A1%80%E7%BB%83%E4%B9%A0/STC89C51%E9%A1%B9%E7%9B%AE%E6%BA%90%E7%A0%81.zip"),a=`   1.5 KB  .eide/eide.yml
    689 B  .eide/files.options.yml
     50 B  .eide/stc.flash.json
   3.5 KB  driver/dht22.c
    452 B  driver/dht22.h
    409 B  driver/hardware.c
    240 B  driver/hardware.h
   9.0 KB  driver/OLED_Font.h
   7.4 KB  driver/oled.c
    692 B  driver/oled.h
   7.1 KB  main.uvopt
  14.6 KB  main.uvproj
    299 B  README.txt
   6.2 KB  STARTUP.A51
   4.5 KB  user/main.c
    138 B  user/main.h`,r=[`STC89C51项目源码

本压缩包由开源协会知识库从学习目录中自动精选生成。
已排除安装包、视频、编译缓存、目标文件、可执行文件、私钥和大型第三方依赖。
部分工程需要通过对应 IDE、SDK 或配置文件重新生成依赖后再编译。`,`#include "dht22.h"\r
#include <intrins.h>\r
\r
sbit DHT_IO = DHT_PIN;\r
\r
int DHT_Temperature = 0;\r
int DHT_Humidity = 0;\r
\r
// 毫秒延时\r
void DHT_DelayMs(unsigned int ms) {\r
    unsigned int i, j;\r
    for (i = ms; i > 0; i--)\r
        for (j = 90; j > 0; j--);\r
}\r
\r
void DHT22_Init(void) {\r
    DHT_IO = 1;\r
    DHT_DelayMs(1000);\r
}\r
\r
unsigned char DHT22_Read(void) {\r
    unsigned char i, idx;\r
    unsigned char U8comdata;\r
    unsigned char Data[5] = {0};\r
    unsigned char check_sum;\r
    \r
    // 计数器，使用 char 类型让循环跑得更快\r
    unsigned char count = 0;\r
\r
    // 关中断！防止中断打断敏感时序\r
    bit EA_SAVE = EA;\r
    EA = 0;\r
\r
    // --- 1. 主机发送起始信号 ---\r
    DHT_IO = 0;\r
    DHT_DelayMs(20); // 拉低 >18ms\r
    DHT_IO = 1;\r
    \r
    // 延时 30us 等待\r
    _nop_(); _nop_(); _nop_(); _nop_(); \r
    _nop_(); _nop_(); _nop_(); _nop_();\r
\r
    // --- 2. 握手阶段 (防死机) ---\r
    // 每一个 while 里面都加了简单的防死机计数 (count)\r
    // 250次循环对于 8MHz 来说大约是 1-2ms，足够了\r
    \r
    // 等待变低 (响应开始)\r
    count = 0;\r
    while (DHT_IO) { if (++count > 250) { EA = EA_SAVE; return 1; } }\r
    \r
    // 等待变高 (响应结束)\r
    count = 0;\r
    while (!DHT_IO) { if (++count > 250) { EA = EA_SAVE; return 1; } }\r
\r
    // 等待变低 (准备传输)\r
    count = 0;\r
    while (DHT_IO) { if (++count > 250) { EA = EA_SAVE; return 1; } }\r
\r
    // --- 3. 读取 40 位数据 ---\r
    for (idx = 0; idx < 5; idx++) {\r
        U8comdata = 0;\r
        for (i = 0; i < 8; i++) {\r
            \r
            // 1. 等待上一位低电平结束 (也就是等待位开始)\r
            // 正常应该是 50us\r
            count = 0;\r
            while (!DHT_IO) {\r
                // 如果这里超时，说明传感器不发数据了\r
                if (++count > 250) { EA = EA_SAVE; return 2; } \r
            }\r
\r
            // 2. 核心：测量高电平长度\r
            // 0: 26us\r
            // 1: 70us\r
            // 我们通过数循环次数来判断\r
            count = 0;\r
            while (DHT_IO) {\r
                count++;\r
                // 30是安全上限，防止卡死\r
                if (count > 30) { EA = EA_SAVE; return 3; } \r
            }\r
\r
            // 3. 判定逻辑 (针对 8MHz 调校)\r
            // 在 8MHz 下，C语言的 while 循环跑一圈很慢 (约10-12us)\r
            // '0' (26us) -> count 大约是 2\r
            // '1' (70us) -> count 大约是 6-7\r
            // 所以我们把阈值设为 4\r
            \r
            U8comdata <<= 1;\r
            if (count > 4) {\r
                U8comdata |= 1;\r
            }\r
        }\r
        Data[idx] = U8comdata;\r
    }\r
\r
    // 恢复中断\r
    EA = EA_SAVE;\r
    DHT_IO = 1;\r
\r
    // --- 4. 校验 ---\r
    check_sum = Data[0] + Data[1] + Data[2] + Data[3];\r
    \r
    // 为了方便调试，如果校验错，我们依然把读到的值放进去，\r
    // 这样你能在屏幕上看到一个“奇怪”的数值，而不是 Err 4\r
    // 这一步在正式产品中不要，但现在调试很有用！\r
    \r
    DHT_Humidity = (Data[0] << 8) | Data[1];\r
    DHT_Temperature = ((Data[2] & 0x7F) << 8) | Data[3];\r
    if (Data[2] & 0x80) DHT_Temperature = -DHT_Temperature;\r
\r
    if (check_sum == Data[4]) {\r
        return 0; // 成功\r
    } else {\r
        // 如果校验失败，返回 4\r
        // 但此时全局变量里已经有值了，你可以看看是多少，帮我判断阈值\r
        return 4; \r
    }\r
}`,`#include "main.h"\r
#include <stdlib.h> // 引入 abs 函数\r
#include <stdio.h>\r
#include "hardware.h"\r
#include "oled.h"\r
#include "dht22.h"\r
\r
sbit PWM_PIN = P2^0;\r
// 全局变量\r
uint8_t timer_count = 0; // 0.1ms 计数器\r
uint8_t duty_cycle = 15; // 占空比值：5对应0度，15对应90度，25对应180度\r
\r
uint32_t time1s=0;\r
uint32_t time2s=0;\r
\r
void Timer0_Init(void)		//1毫秒@8MHz\r
{\r
	TMOD &= 0xF0;			//设置定时器模式\r
	TL0 = 0xC0;				//设置定时初始值\r
	TH0 = 0xE0;				//设置定时初始值\r
	TF0 = 0;				//清除TF0标志\r
	TR0 = 1;				//定时器0开始计时\r
	ET0 = 1;				//使能定时器0中断\r
	EA = 1;\r
}\r
/******LED使用********/\r
bit led_flag=0;\r
uint8_t led_time=0;\r
/********BEEP使用*********/\r
bit beep_flag=0;\r
uint32_t beep_time=0;\r
unsigned char status=0;\r
\r
/**\r
 * @brief 定时器1初始化函数 (针对 8MHz 晶振)\r
 * 目标：约 0.1ms (100.5us) 中断一次\r
 */\r
void InitTimer1()\r
{\r
    TMOD &= 0x0F;      // 清除T1配置\r
    TMOD |= 0x10;      // 模式1 (16位)\r
    \r
    // 8MHz 晶振下的初值: 0xFFBD\r
    TH1 = 0xFF; \r
    TL1 = 0xBD;\r
    \r
    ET1 = 1;           // 开启定时器1中断\r
    EA = 1;            // 开启总中断\r
    TR1 = 1;           // 启动定时器1\r
}\r
\r
void main(void)\r
{\r
    Timer0_Init();\r
    P1_7 = 0;\r
	P2_3 = 0; \r
    OLED_Init();\r
    OLED_Clear();\r
	OLED_ShowString(1, 1, "Hello, CDUT!");\r
    DHT22_Init();duty_cycle = 15;\r
    InitTimer1();\r
    duty_cycle = 5; // 设置初始占空比为 5 (0度)\r
    while(1)\r
    {\r
        P2_3 = 0; \r
        if(time1s>=500)\r
        {\r
            time1s = 0; // 立即清零，防止重复进入\r
            if(duty_cycle>=25)\r
            {\r
                duty_cycle=5;\r
            }\r
            else\r
            {\r
                duty_cycle+=5;\r
            }\r
            if(led_flag == 0) // 阶段1：逐个点亮 (P1.0 -> P1.6)\r
            {\r
                led_time++;\r
                if(led_time <= 7)\r
                {\r
                    // 0xFF << 1 = 1111 1110 (P1.0 亮)\r
                    // 0xFF << 7 = 1000 0000 (P1.0-P1.6 亮)\r
                    P1 &= (0xFF << led_time);\r
                }\r
                else\r
                {\r
                    led_time = 0;\r
                    led_flag = 1; // 切换到熄灭模式\r
                }\r
            }\r
            else // 阶段2：逐个熄灭 (P1.0 -> P1.6)\r
            {\r
                led_time++;\r
                if(led_time <= 7)\r
                {\r
                    // 0xFF << 1 = 1111 1110; 取反 = 0000 0001 (P1.0 灭)\r
                    // 0xFF << 7 = 1000 0000; 取反 = 0111 1111 (P1.0-P1.6 灭)\r
                    P1 |= ~(0xFF << led_time);\r
                }\r
                else\r
                {\r
                    led_time = 0;\r
                    led_flag = 0; // 切换回点亮模式\r
                }\r
            }\r
        }\r
        \r
        if(beep_time>=250)\r
        {\r
            beep_flag=0;\r
            beep_time=0;\r
        }\r
        // 强制控制 P1.7，覆盖上方 LED 逻辑对 P1.7 的潜在影响\r
        if(beep_flag==1)\r
            P1_7 = 1;\r
        else\r
            P1_7 = 0;\r
        if(time2s>=500)\r
        {\r
            status = DHT22_Read(); // 获取返回值\r
            if (status == 0 || status == 4) \r
            {\r
                char buffer[16];\r
                int temp_int = DHT_Temperature / 10;\r
                int temp_frac = abs(DHT_Temperature % 10);\r
                int humi_int = DHT_Humidity / 10;\r
                int humi_frac = abs(DHT_Humidity % 10);\r
\r
                sprintf(buffer, "T:%d.%d %s", temp_int, temp_frac, (status==4)?"*":" ");\r
                OLED_ShowString(2, 1, buffer); // 如果有*号，说明校验错但有数据\r
                \r
                sprintf(buffer, "H:%d.%d%%", humi_int, humi_frac);\r
                OLED_ShowString(3, 1, buffer);\r
            }\r
            else\r
            {\r
                char err_buf[16];\r
                sprintf(err_buf, "Err: %d", (int)status);\r
                OLED_ShowString(2, 1, err_buf);\r
            }\r
            time2s=0;\r
        }\r
    }\r
}\r
\r
void Timer0_Isr(void) interrupt 1\r
{\r
    // 必须重装载初值，否则定时器周期不正确\r
    TL0 = 0xC0;\r
    TH0 = 0xE0; \r
    time1s++;\r
    time2s++;\r
	key_scan();\r
	if(key_value!=0&&beep_flag==0)\r
	{\r
		beep_flag=1;\r
	}\r
	if(beep_flag==1)\r
	{\r
		beep_time++;\r
	}\r
}\r
\r
/**\r
 * @brief 定时器1中断服务程序 (针对 8MHz 晶振)\r
 */\r
void Timer1_ISR() interrupt 3\r
{\r
    // === 必须在这里也修改初值 ===\r
    TH1 = 0xFF;\r
    TL1 = 0xBD;\r
    \r
    timer_count++; \r
    \r
    if(timer_count >= 200) // 约 20ms 周期\r
    {\r
        timer_count = 0;\r
    }\r
    \r
    if(timer_count < duty_cycle)\r
    {\r
        PWM_PIN = 1; \r
    }\r
    else\r
    {\r
        PWM_PIN = 0; \r
    }\r
}`,`#include "hardware.h"\r
\r
uint8_t key_value=0;\r
uint8_t key_state=0;\r
\r
void key_scan(void)\r
{\r
	if(P0_0==0)\r
	{\r
		key_value=key1;\r
		key_state++;\r
	}\r
	else if(P0_1 == 0)\r
	{\r
		key_value=key2;\r
		key_state++;\r
	}\r
	else if(P0_2 == 0)\r
	{\r
		key_value = key3;\r
		key_state++;\r
	}\r
	else if (P3_2 == 1)\r
	{\r
		key_value = key4;\r
		key_state++;\r
	}\r
	else\r
	{\r
		key_value = nokey;\r
		key_state = 0;\r
	}\r
}\r
\r
`,`#include "OLED_Font.h"\r
#include "oled.h"\r
/*引脚配置*/\r
sbit OLED_SCL = P0^5;\r
sbit OLED_SDA = P0^6;\r
\r
#define OLED_W_SCL OLED_SCL\r
#define OLED_W_SDA OLED_SDA\r
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
`,`#ifndef __DHT22_H__\r
#define __DHT22_H__\r
\r
#include "main.h"\r
\r
// ================= 配置区 =================\r
// 确认你的硬件接在哪里！这里设为 P2.7\r
#define DHT_PIN P2^7  \r
// =========================================\r
\r
extern int DHT_Temperature;\r
extern int DHT_Humidity;\r
\r
void DHT22_Init(void);\r
// 返回值：0=成功, 1=无响应, 2=数据0超时, 3=数据1超时, 4=校验错误\r
unsigned char DHT22_Read(void);\r
\r
#endif`,`#ifndef __MAIN_H__\r
#define __MAIN_H__\r
\r
#include <REGX51.H>\r
\r
typedef unsigned char uint8_t;\r
typedef unsigned int  uint32_t;\r
\r
#endif`,`#ifndef __HARDWARE_H__\r
#define __HARDWARE_H__\r
\r
#include "main.h"\r
\r
#define key1 1\r
#define key2 2\r
#define key3 3\r
#define key4 4\r
#define nokey 0\r
\r
extern uint8_t key_value;\r
extern uint8_t key_state;\r
\r
void key_scan(void);\r
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
        - path: STARTUP.A51
        - path: user/main.c
      folders: []
    - name: driver
      files:
        - path: driver/hardware.c
        - path: driver/hardware.h
        - path: driver/oled.c
        - path: driver/oled.h
        - path: driver/OLED_Font.h
        - path: driver/dht22.c
        - path: driver/dht22.h
      folders: []
dependenceList: []
outDir: build
miscInfo:
  uid: 16c090c82adaa02ac30f30ffa3154440
targets:
  Target 1:
    cppPreprocessAttrs:
      defineList: []
      incList:
        - d:/KEIL_MDK/mdk/C51/INC/Atmel
        - driver
        - user
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
`,`##########################################################################################\r
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
`,`{
    "device": "auto",
    "baudrate": "115200"
}`,`#ifndef __OLED_H\r
#define __OLED_H\r
\r
#include "main.h"\r
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
`];return(U,x)=>(s(),l("div",null,[x[16]||(x[16]=n("h1",{id:"stc89c51项目源码",tabindex:"-1"},[e("STC89C51项目源码 "),n("a",{class:"header-anchor",href:"#stc89c51项目源码","aria-label":'Permalink to "STC89C51项目源码"'},"​")],-1)),x[17]||(x[17]=n("div",{class:"kb-file-meta"},[n("span",null,[n("strong",null,"目录"),e("嵌入式 / 51单片机 / 基础练习")]),n("span",null,[n("strong",null,"格式"),e("ZIP")]),n("span",null,[n("strong",null,"大小"),e("17.0 KB")])],-1)),n("p",_,[n("a",{class:"kb-download-button kb-download-button-secondary",href:o(i),download:""},"下载完整源码包",8,m)]),x[18]||(x[18]=n("h2",{id:"在线预览",tabindex:"-1"},[e("在线预览 "),n("a",{class:"header-anchor",href:"#在线预览","aria-label":'Permalink to "在线预览"'},"​")],-1)),x[19]||(x[19]=n("div",{class:"kb-preview-summary"},[n("span",null,[n("strong",null,"16"),e(" 个文件")]),n("span",null,[n("strong",null,"3"),e(" 个目录")]),n("span",null,[n("strong",null,"56.6 KB"),e(" 解压后大小")])],-1)),n("div",E,[x[15]||(x[15]=d("",1)),n("details",{class:"kb-preview-panel kb-archive-index"},[x[0]||(x[0]=n("summary",null,"查看完整目录 · 16 个文件",-1)),n("pre",{textContent:a})]),n("section",C,[x[14]||(x[14]=n("h3",{id:"doc-a7125a7496-source-heading"},"可读文件预览",-1)),n("details",p,[x[1]||(x[1]=n("summary",null,[n("span",null,"README.txt"),n("small",null,"299 B")],-1)),n("pre",null,[n("code",{textContent:t(r[0])},null,8,c)])]),n("details",D,[x[2]||(x[2]=n("summary",null,[n("span",null,"driver/dht22.c"),n("small",null,"3.5 KB")],-1)),n("pre",null,[n("code",{textContent:t(r[1])},null,8,h)])]),n("details",L,[x[3]||(x[3]=n("summary",null,[n("span",null,"user/main.c"),n("small",null,"4.5 KB")],-1)),n("pre",null,[n("code",{textContent:t(r[2])},null,8,F)])]),n("details",g,[x[4]||(x[4]=n("summary",null,[n("span",null,"driver/hardware.c"),n("small",null,"409 B")],-1)),n("pre",null,[n("code",{textContent:t(r[3])},null,8,O)])]),n("details",f,[x[5]||(x[5]=n("summary",null,[n("span",null,"driver/oled.c"),n("small",null,"7.4 KB")],-1)),n("pre",null,[n("code",{textContent:t(r[4])},null,8,v)])]),n("details",b,[x[6]||(x[6]=n("summary",null,[n("span",null,"driver/dht22.h"),n("small",null,"452 B")],-1)),n("pre",null,[n("code",{textContent:t(r[5])},null,8,S)])]),n("details",T,[x[7]||(x[7]=n("summary",null,[n("span",null,"user/main.h"),n("small",null,"138 B")],-1)),n("pre",null,[n("code",{textContent:t(r[6])},null,8,y)])]),n("details",w,[x[8]||(x[8]=n("summary",null,[n("span",null,"driver/hardware.h"),n("small",null,"240 B")],-1)),n("pre",null,[n("code",{textContent:t(r[7])},null,8,k)])]),n("details",A,[x[9]||(x[9]=n("summary",null,[n("span",null,".eide/eide.yml"),n("small",null,"1.5 KB")],-1)),n("pre",null,[n("code",{textContent:t(r[8])},null,8,I)])]),n("details",H,[x[10]||(x[10]=n("summary",null,[n("span",null,".eide/files.options.yml"),n("small",null,"689 B")],-1)),n("pre",null,[n("code",{textContent:t(r[9])},null,8,B)])]),n("details",P,[x[11]||(x[11]=n("summary",null,[n("span",null,"driver/OLED_Font.h"),n("small",null,"9.0 KB")],-1)),n("pre",null,[n("code",{textContent:t(r[10])},null,8,W)])]),n("details",N,[x[12]||(x[12]=n("summary",null,[n("span",null,".eide/stc.flash.json"),n("small",null,"50 B")],-1)),n("pre",null,[n("code",{textContent:t(r[11])},null,8,M)])]),n("details",R,[x[13]||(x[13]=n("summary",null,[n("span",null,"driver/oled.h"),n("small",null,"692 B")],-1)),n("pre",null,[n("code",{textContent:t(r[12])},null,8,K)])])])])]))}});export{z as __pageData,Y as default};
