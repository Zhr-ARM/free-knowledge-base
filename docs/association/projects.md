---
layout: page
sidebar: false
aside: false
outline: false
title: 项目成果
description: 开源协会在智能探测、ROS 机器人、智能小车和移动机器人平台方面的项目实践。
---

<script setup>
import { withBase } from 'vitepress'
import { ArrowRight, Bot, Cpu, Radar, Route, Settings2 } from '@lucide/vue'
</script>

<main class="osa-site osa-inner-page">
  <header class="osa-page-hero osa-projects-hero">
    <img :src="withBase('/association/robot-platform.webp')" alt="协会成员展示移动机器人平台" width="1400" height="1050" fetchpriority="high" decoding="async">
    <div class="osa-page-hero-shade" aria-hidden="true"></div>
    <div class="osa-shell osa-page-hero-copy">
      <p class="osa-kicker">Projects</p>
      <h1>项目成果</h1>
      <p>从单个模块到完整系统，用真实项目连接硬件、软件、控制与协作。</p>
    </div>
  </header>

  <section class="osa-band">
    <div class="osa-shell">
      <div class="osa-section-heading">
        <div>
          <p class="osa-kicker">代表项目</p>
          <h2>围绕感知、控制与智能系统持续实践</h2>
        </div>
      </div>
      <div class="osa-project-showcase">
        <article class="osa-project-row">
          <div class="osa-project-image osa-project-image-contain">
            <img :src="withBase('/association/spherical-detector.webp')" alt="双模态球形智能探测系统原型" width="544" height="613" loading="lazy" decoding="async">
          </div>
          <div class="osa-project-copy">
            <span class="osa-card-label"><Radar :size="15" aria-hidden="true" /> 智能探测</span>
            <h3>STM32H7 双模态球形智能探测系统</h3>
            <p>面向管道、矿井和狭窄空间等环境，探索具备空地双模态能力的球形探测平台。项目覆盖机械结构、嵌入式控制、通信与环境信息采集。</p>
            <ul>
              <li>球形防护结构与移动机构</li>
              <li>STM32H7 控制与传感器接入</li>
              <li>复杂空间下的远程探测设想</li>
            </ul>
          </div>
        </article>
        <article class="osa-project-row osa-project-row-reverse">
          <div class="osa-project-image">
            <img :src="withBase('/association/robot-dog.webp')" alt="协会智能机器狗项目" width="1400" height="1050" loading="lazy" decoding="async">
          </div>
          <div class="osa-project-copy">
            <span class="osa-card-label"><Bot :size="15" aria-hidden="true" /> ROS 机器人</span>
            <h3>智能机器狗</h3>
            <p>围绕机器人感知、状态控制与 ROS 系统集成开展实践，在实体平台上验证从指令到动作执行的完整链路。</p>
            <ul>
              <li>机器人软件框架与节点通信</li>
              <li>运动状态控制与动作调试</li>
              <li>传感器数据接入和现场演示</li>
            </ul>
          </div>
        </article>
        <article class="osa-project-row">
          <div class="osa-project-image">
            <img :src="withBase('/association/smart-car-hardware.webp')" alt="协会智能小车硬件平台" width="1400" height="1050" loading="lazy" decoding="async">
          </div>
          <div class="osa-project-copy">
            <span class="osa-card-label"><Route :size="15" aria-hidden="true" /> 运动控制</span>
            <h3>智能循迹小车</h3>
            <p>以小车平台完成传感器采样、电机驱动和控制算法联调，是成员从 MCU 基础走向完整嵌入式系统的重要实践载体。</p>
            <ul>
              <li>循迹传感器标定与数据处理</li>
              <li>电机驱动、编码器和闭环控制</li>
              <li>赛道测试与参数迭代</li>
            </ul>
          </div>
        </article>
        <article class="osa-project-row osa-project-row-reverse">
          <div class="osa-project-image">
            <img :src="withBase('/association/robot-platform.webp')" alt="带激光雷达的移动机器人平台" width="1400" height="1050" loading="lazy" decoding="async">
          </div>
          <div class="osa-project-copy">
            <span class="osa-card-label"><Settings2 :size="15" aria-hidden="true" /> 系统集成</span>
            <h3>移动机器人平台</h3>
            <p>将底盘、激光雷达、控制板和计算单元组合成可继续开发的移动平台，用于展示与后续导航、感知实验。</p>
            <ul>
              <li>多传感器与计算平台集成</li>
              <li>移动底盘控制和整机供电</li>
              <li>科技活动中的现场展示</li>
            </ul>
          </div>
        </article>
      </div>
    </div>
  </section>

  <section class="osa-band osa-muted-band">
    <div class="osa-shell">
      <div class="osa-section-heading">
        <div>
          <p class="osa-kicker">持续探索</p>
          <h2>更多方向正在积累</h2>
        </div>
      </div>
      <div class="osa-explore-grid">
        <article><Cpu :size="23" aria-hidden="true" /><h3>龙芯工业网关</h3><p>围绕龙芯 2K1000LA 平台探索工业通信、数据采集与边缘处理。</p></article>
        <article><Settings2 :size="23" aria-hidden="true" /><h3>蓝牙履带小车</h3><p>完成无线控制、驱动模块和履带底盘的基础系统整合。</p></article>
        <article><Radar :size="23" aria-hidden="true" /><h3>视觉与智能感知</h3><p>关注图像处理、目标识别及其在机器人场景中的应用。</p></article>
      </div>
    </div>
  </section>

  <section class="osa-resource-band">
    <div class="osa-shell osa-resource-inner">
      <div>
        <p class="osa-kicker">知识沉淀</p>
        <h2>从项目回到资料，再从资料走向下一个项目</h2>
        <p>目前已收录嵌入式控制与机器人控制资料；电源、信号方向暂无资料。</p>
      </div>
      <div class="osa-resource-actions">
        <a class="osa-button osa-button-primary" :href="withBase('/library/')">打开资料库 <ArrowRight :size="18" aria-hidden="true" /></a>
      </div>
    </div>
  </section>
</main>
