---
layout: page
sidebar: false
aside: false
outline: false
title: 关于开源协会
description: 了解成都理工大学开源协会的定位、四个技术方向与部门分工。
---

<script setup>
import { withBase } from 'vitepress'
import {
  Activity,
  ArrowRight,
  BatteryCharging,
  Bot,
  CalendarDays,
  CircuitBoard,
  Code2,
  GraduationCap,
  Megaphone,
  Microchip,
  UsersRound
} from '@lucide/vue'
</script>

<main class="osa-site osa-inner-page">
  <header class="osa-page-hero">
    <img :src="withBase('/association/hands-on-soldering.webp')" alt="协会成员进行焊接和硬件调试" width="1400" height="1050" fetchpriority="high" decoding="async">
    <div class="osa-page-hero-shade" aria-hidden="true"></div>
    <div class="osa-shell osa-page-hero-copy">
      <p class="osa-kicker">About OSA</p>
      <h1>关于开源协会</h1>
      <p>一起学技术，一起做项目，一起分享经验。</p>
    </div>
  </header>

  <section class="osa-fact-band" aria-label="协会基本信息">
    <dl class="osa-shell osa-fact-list">
      <div><dt>2015</dt><dd>协会成立</dd></div>
      <div><dt>236</dt><dd>协会成员</dd></div>
      <div><dt>4</dt><dd>技术方向</dd></div>
      <div><dt>5</dt><dd>主要竞赛培训</dd></div>
    </dl>
  </section>

  <section class="osa-band">
    <div class="osa-shell osa-story-grid">
      <div class="osa-section-copy">
        <p class="osa-kicker">协会定位</p>
        <h2>面向实践的技术学习共同体</h2>
        <p>开源协会是成都理工大学学术科技类学生社团，围绕电子系统与机器人开展学习、培训和项目实践。</p>
        <p>从查资料、写代码到搭电路和整机联调，成员在真实问题中积累工程经验。</p>
      </div>
      <figure class="osa-feature-photo">
        <img :src="withBase('/association/training-bench.webp')" alt="协会成员在实验台前学习嵌入式开发" width="1400" height="1050" loading="lazy" decoding="async">
        <figcaption>线上资料、线下培训与项目实践相结合。</figcaption>
      </figure>
    </div>
  </section>

  <section class="osa-band osa-muted-band">
    <div class="osa-shell">
      <div class="osa-section-heading">
        <div>
          <p class="osa-kicker">技术方向</p>
          <h2>四个方向</h2>
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

  <section class="osa-band">
    <div class="osa-shell">
      <div class="osa-section-heading">
        <div>
          <p class="osa-kicker">部门分工</p>
          <h2>四个协作部门</h2>
        </div>
      </div>
      <div class="osa-department-grid">
        <article>
          <span class="osa-icon-box"><CircuitBoard :size="24" aria-hidden="true" /></span>
          <h3>硬件部</h3>
          <p>电路设计、PCB、焊接与硬件调试。</p>
        </article>
        <article>
          <span class="osa-icon-box"><Code2 :size="24" aria-hidden="true" /></span>
          <h3>软件部</h3>
          <p>嵌入式编程、算法、ROS 与系统集成。</p>
        </article>
        <article>
          <span class="osa-icon-box osa-icon-box-red"><CalendarDays :size="24" aria-hidden="true" /></span>
          <h3>活动部</h3>
          <p>培训、竞赛和协会活动组织。</p>
        </article>
        <article>
          <span class="osa-icon-box osa-icon-box-navy"><Megaphone :size="24" aria-hidden="true" /></span>
          <h3>宣传部</h3>
          <p>活动记录、视觉内容与成果展示。</p>
        </article>
      </div>
    </div>
  </section>

  <section class="osa-resource-band">
    <div class="osa-shell osa-resource-inner">
      <div>
        <p class="osa-kicker">继续了解</p>
        <h2>查看项目与活动</h2>
      </div>
      <div class="osa-resource-actions">
        <a class="osa-button osa-button-primary" :href="withBase('/association/projects')"><GraduationCap :size="19" aria-hidden="true" /> 项目成果</a>
        <a class="osa-button osa-button-outline" :href="withBase('/association/activities')"><UsersRound :size="19" aria-hidden="true" /> 活动记录</a>
      </div>
    </div>
  </section>
</main>
