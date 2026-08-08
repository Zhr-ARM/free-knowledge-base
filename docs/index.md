---
layout: page
sidebar: false
aside: false
outline: false
title: 成都理工大学开源协会
description: 成都理工大学开源协会官网，聚焦电源、信号、嵌入式控制与机器人控制。
---

<script setup>
import { withBase } from 'vitepress'
import {
  Activity,
  ArrowRight,
  BatteryCharging,
  BookOpen,
  Bot,
  Car,
  Microchip,
  Radio,
  Trophy,
  Zap
} from '@lucide/vue'
</script>

<main class="osa-site osa-home osa-home-compact">
  <section class="osa-hero" aria-labelledby="osa-home-title" :style="{ backgroundImage: 'url(' + withBase('/association/hero-group.webp') + ')' }">
    <img
      class="osa-hero-media"
      :src="withBase('/association/hero-group.webp')"
      alt="成都理工大学开源协会成员合影"
      width="2000"
      height="1333"
      fetchpriority="high"
      decoding="async"
    >
    <div class="osa-hero-shade" aria-hidden="true"></div>
    <div class="osa-shell osa-hero-inner">
      <div class="osa-hero-copy">
        <p class="osa-kicker">成都理工大学 · 学术科技类学生社团</p>
        <h1 id="osa-home-title">开源协会</h1>
        <p class="osa-hero-lead">聚焦电源、信号、嵌入式控制与机器人控制。一起学习，一起把方案做成能运行的作品。</p>
        <div class="osa-actions">
          <a class="osa-button osa-button-primary" :href="withBase('/library/')">
            <BookOpen :size="19" aria-hidden="true" />
            浏览资料库
          </a>
          <a class="osa-button osa-button-quiet" :href="withBase('/association/')">
            认识协会
            <ArrowRight :size="18" aria-hidden="true" />
          </a>
        </div>
      </div>
      <dl class="osa-hero-stats" aria-label="协会概况">
        <div><dt>2015</dt><dd>协会成立</dd></div>
        <div><dt>236</dt><dd>协会成员</dd></div>
        <div><dt>4</dt><dd>技术方向</dd></div>
      </dl>
    </div>
  </section>

  <section class="osa-band osa-tech-band">
    <div class="osa-shell">
      <div class="osa-section-heading">
        <div>
          <p class="osa-kicker">技术方向</p>
          <h2>四个方向，组成一套完整技术链</h2>
        </div>
      </div>
      <div class="osa-tech-grid">
        <a class="osa-tech-card osa-tech-power" :href="withBase('/guide/power')">
          <span class="osa-tech-icon"><BatteryCharging :size="25" aria-hidden="true" /></span>
          <h3>电源</h3>
          <p>电源变换、供电设计、器件选型与调试。</p>
          <span class="osa-tech-meta osa-tech-empty">暂无资料 <ArrowRight :size="16" aria-hidden="true" /></span>
        </a>
        <a class="osa-tech-card osa-tech-signal" :href="withBase('/guide/signal')">
          <span class="osa-tech-icon"><Activity :size="25" aria-hidden="true" /></span>
          <h3>信号</h3>
          <p>信号采集、调理、处理与通信。</p>
          <span class="osa-tech-meta osa-tech-empty">暂无资料 <ArrowRight :size="16" aria-hidden="true" /></span>
        </a>
        <a class="osa-tech-card osa-tech-embedded" :href="withBase('/guide/embedded')">
          <span class="osa-tech-icon"><Microchip :size="25" aria-hidden="true" /></span>
          <h3>控制（嵌入式）</h3>
          <p>MCU、RTOS、驱动与控制程序。</p>
          <span class="osa-tech-meta">查看资料 <ArrowRight :size="16" aria-hidden="true" /></span>
        </a>
        <a class="osa-tech-card osa-tech-robot" :href="withBase('/guide/robot-motion-control')">
          <span class="osa-tech-icon"><Bot :size="25" aria-hidden="true" /></span>
          <h3>控制（机器人）</h3>
          <p>ROS、运动控制、感知与系统集成。</p>
          <span class="osa-tech-meta">查看资料 <ArrowRight :size="16" aria-hidden="true" /></span>
        </a>
      </div>
    </div>
  </section>

  <section class="osa-band osa-muted-band osa-competition-band">
    <div class="osa-shell osa-competition-layout">
      <figure class="osa-competition-photo">
        <img :src="withBase('/association/osa-cup.webp')" alt="协会成员在竞赛训练中调试硬件" width="1400" height="1050" loading="lazy" decoding="async">
        <figcaption>以赛促学，把知识落实到设计、调试和协作中。</figcaption>
      </figure>
      <div class="osa-competition-copy">
        <p class="osa-kicker">竞赛培训</p>
        <h2>五项主要比赛</h2>
        <p>围绕不同技术方向开展基础培训、专项练习和项目实践。</p>
        <div class="osa-competition-list">
          <div class="osa-competition-item"><span><Trophy :size="20" aria-hidden="true" /></span><strong>蓝桥杯</strong><small>编程与单片机</small></div>
          <div class="osa-competition-item"><span><Radio :size="20" aria-hidden="true" /></span><strong>大唐杯</strong><small>通信技术</small></div>
          <div class="osa-competition-item"><span><Zap :size="20" aria-hidden="true" /></span><strong>电子设计大赛</strong><small>电子系统设计</small></div>
          <div class="osa-competition-item"><span><Bot :size="20" aria-hidden="true" /></span><strong>RoboCon</strong><small>机器人系统</small></div>
          <div class="osa-competition-item"><span><Car :size="20" aria-hidden="true" /></span><strong>智能车</strong><small>感知与运动控制</small></div>
        </div>
      </div>
    </div>
  </section>

  <section class="osa-band">
    <div class="osa-shell">
      <div class="osa-section-heading">
        <div>
          <p class="osa-kicker">项目实践</p>
          <h2>从模块调试到完整系统</h2>
        </div>
        <a class="osa-text-link" :href="withBase('/association/projects')">
          全部项目
          <ArrowRight :size="17" aria-hidden="true" />
        </a>
      </div>
      <div class="osa-card-grid osa-project-preview">
        <article class="osa-media-card">
          <img :src="withBase('/association/spherical-detector.webp')" alt="双模态球形智能探测系统原型" width="544" height="613" loading="lazy" decoding="async">
          <div class="osa-card-body">
            <span class="osa-card-label">智能探测</span>
            <h3>双模态球形智能探测系统</h3>
            <p>面向狭窄空间的空地协同探测平台。</p>
          </div>
        </article>
        <article class="osa-media-card">
          <img :src="withBase('/association/robot-dog.webp')" alt="协会机器狗项目原型" width="1400" height="1050" loading="lazy" decoding="async">
          <div class="osa-card-body">
            <span class="osa-card-label">机器人控制</span>
            <h3>智能机器狗</h3>
            <p>感知、运动与 ROS 系统集成实践。</p>
          </div>
        </article>
        <article class="osa-media-card">
          <img :src="withBase('/association/smart-car-track.webp')" alt="协会智能循迹小车在赛道上运行" width="1400" height="1050" loading="lazy" decoding="async">
          <div class="osa-card-body">
            <span class="osa-card-label">运动控制</span>
            <h3>智能循迹小车</h3>
            <p>传感器、电机驱动与控制算法联调。</p>
          </div>
        </article>
      </div>
    </div>
  </section>

  <section class="osa-resource-band">
    <div class="osa-shell osa-resource-inner">
      <div>
        <p class="osa-kicker">开放知识库</p>
        <h2>资料按方向整理，支持在线阅读与下载</h2>
        <p>目前已收录嵌入式控制与机器人控制资料；电源、信号方向暂无资料。</p>
      </div>
      <div class="osa-resource-actions">
        <a class="osa-button osa-button-primary" :href="withBase('/library/')"><BookOpen :size="19" aria-hidden="true" /> 浏览全部资料</a>
      </div>
    </div>
  </section>
</main>
