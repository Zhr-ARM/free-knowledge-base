---
layout: page
sidebar: false
aside: false
outline: false
title: 关于开源协会
description: 了解成都理工大学开源协会的定位、技术方向、部门分工与学习方式。
---

<script setup>
import { withBase } from 'vitepress'
import {
  ArrowRight,
  CalendarDays,
  CircuitBoard,
  Code2,
  GraduationCap,
  Megaphone,
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
      <p>一群对代码、电路和机器人保持好奇的人，在开放协作中一起学习，也一起把想法做成作品。</p>
    </div>
  </header>

  <section class="osa-fact-band" aria-label="协会基本信息">
    <dl class="osa-shell osa-fact-list">
      <div><dt>2015</dt><dd>协会成立</dd></div>
      <div><dt>236</dt><dd>协会成员</dd></div>
      <div><dt>4</dt><dd>协作部门</dd></div>
      <div><dt>2</dt><dd>核心技术方向</dd></div>
    </dl>
  </section>

  <section class="osa-band">
    <div class="osa-shell osa-story-grid">
      <div class="osa-section-copy">
        <p class="osa-kicker">协会定位</p>
        <h2>面向真实问题的技术学习共同体</h2>
        <p>开源协会是成都理工大学学术科技类学生社团，主要围绕嵌入式系统、机器人运动控制及相关软硬件技术开展学习与实践。</p>
        <p>协会不把学习停留在“听懂”。从基础课程、任务练习到项目联调，成员会经历查资料、写代码、搭电路、定位问题和复盘分享的完整过程。</p>
      </div>
      <figure class="osa-feature-photo">
        <img :src="withBase('/association/training-bench.webp')" alt="协会成员在实验台前学习嵌入式开发" width="1400" height="1050" loading="lazy" decoding="async">
        <figcaption>线上资料与线下实践结合，让知识能够落到真实硬件上。</figcaption>
      </figure>
    </div>
  </section>

  <section class="osa-band osa-muted-band">
    <div class="osa-shell">
      <div class="osa-section-heading">
        <div>
          <p class="osa-kicker">共同准则</p>
          <h2>开放、平等、共享、协作</h2>
        </div>
      </div>
      <div class="osa-value-grid">
        <article><strong>开放</strong><p>主动接触新技术，也尊重不同的技术路线与想法。</p></article>
        <article><strong>平等</strong><p>以问题和作品交流，每个人都可以提出观点、参与讨论。</p></article>
        <article><strong>共享</strong><p>把资料、经验与复盘沉淀下来，减少重复踩坑。</p></article>
        <article><strong>协作</strong><p>在项目中明确分工、互相补位，一起完成系统联调。</p></article>
      </div>
    </div>
  </section>

  <section class="osa-band">
    <div class="osa-shell">
      <div class="osa-section-heading">
        <div>
          <p class="osa-kicker">部门分工</p>
          <h2>让技术、活动与内容各自有人负责</h2>
        </div>
      </div>
      <div class="osa-department-grid">
        <article>
          <span class="osa-icon-box"><CircuitBoard :size="24" aria-hidden="true" /></span>
          <h3>硬件部</h3>
          <p>电子基础、原理图与 PCB、焊接调试、传感器和执行器应用。</p>
        </article>
        <article>
          <span class="osa-icon-box"><Code2 :size="24" aria-hidden="true" /></span>
          <h3>软件部</h3>
          <p>嵌入式编程、算法实现、ROS、上位机与系统集成。</p>
        </article>
        <article>
          <span class="osa-icon-box osa-icon-box-red"><CalendarDays :size="24" aria-hidden="true" /></span>
          <h3>活动部</h3>
          <p>培训、竞赛、分享会和志愿活动的组织与现场协同。</p>
        </article>
        <article>
          <span class="osa-icon-box osa-icon-box-navy"><Megaphone :size="24" aria-hidden="true" /></span>
          <h3>宣传部</h3>
          <p>活动记录、视觉内容、成果展示与协会对外信息整理。</p>
        </article>
      </div>
    </div>
  </section>

  <section class="osa-band osa-learning-band">
    <div class="osa-shell osa-learning-grid">
      <div class="osa-section-copy">
        <p class="osa-kicker">学习方式</p>
        <h2>从基础入门，逐步进入完整项目</h2>
        <p>协会采用线上开放资料、线下教学、任务练习和竞赛项目相结合的方式。学习路径不是固定模板，成员可以根据兴趣进入嵌入式或机器人方向。</p>
        <a class="osa-text-link" :href="withBase('/library/')">打开学习资料 <ArrowRight :size="17" aria-hidden="true" /></a>
      </div>
      <ol class="osa-learning-steps">
        <li><span>01</span><div><strong>编程与电路基础</strong><p>C 语言、51 单片机、基本电子元件与工具使用。</p></div></li>
        <li><span>02</span><div><strong>MCU 与实时系统</strong><p>STM32、ESP32、FreeRTOS、RT-Thread 与常见外设。</p></div></li>
        <li><span>03</span><div><strong>系统能力拓展</strong><p>PCB、Linux、通信协议、电机控制和工程调试。</p></div></li>
        <li><span>04</span><div><strong>机器人项目实践</strong><p>ROS、运动控制、感知算法与软硬件系统集成。</p></div></li>
      </ol>
    </div>
  </section>

  <section class="osa-resource-band">
    <div class="osa-shell osa-resource-inner">
      <div>
        <p class="osa-kicker">继续了解</p>
        <h2>看看我们正在做什么</h2>
        <p>项目页记录技术实践，活动页记录协会共同经历的现场。</p>
      </div>
      <div class="osa-resource-actions">
        <a class="osa-button osa-button-primary" :href="withBase('/association/projects')"><GraduationCap :size="19" aria-hidden="true" /> 项目成果</a>
        <a class="osa-button osa-button-outline" :href="withBase('/association/activities')"><UsersRound :size="19" aria-hidden="true" /> 活动记录</a>
      </div>
    </div>
  </section>
</main>

