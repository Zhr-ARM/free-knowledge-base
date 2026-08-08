---
layout: page
sidebar: false
aside: false
outline: false
title: 活动记录
description: 开源协会的培训、竞赛、科技志愿服务与成员交流活动记录。
---

<script setup>
import { withBase } from 'vitepress'
import { ArrowRight, CalendarDays, CircuitBoard, GraduationCap, HeartHandshake, UsersRound } from '@lucide/vue'
</script>

<main class="osa-site osa-inner-page">
  <header class="osa-page-hero osa-activities-hero">
    <img :src="withBase('/association/community-group.webp')" alt="开源协会科技志愿活动合影" width="1800" height="1200" fetchpriority="high" decoding="async">
    <div class="osa-page-hero-shade" aria-hidden="true"></div>
    <div class="osa-shell osa-page-hero-copy">
      <p class="osa-kicker">Activities</p>
      <h1>活动记录</h1>
      <p>一起学习，也把技术带到更远的地方。这里记录培训、竞赛、分享和科技志愿服务的现场。</p>
    </div>
  </header>

  <section class="osa-band">
    <div class="osa-shell">
      <div class="osa-section-heading">
        <div>
          <p class="osa-kicker">活动现场</p>
          <h2>知识在动手、交流与分享中真正留下来</h2>
        </div>
      </div>
      <div class="osa-timeline">
        <article class="osa-timeline-item">
          <div class="osa-timeline-date"><strong>2025</strong><span>11.15</span></div>
          <img :src="withBase('/association/community-demo.webp')" alt="社区儿童观看智能小车演示" width="1400" height="933" loading="lazy" decoding="async">
          <div class="osa-timeline-copy">
            <span class="osa-card-label"><HeartHandshake :size="15" aria-hidden="true" /> 科技志愿</span>
            <h3>“智绘童梦，械享科技”社区活动</h3>
            <p>协会成员走进锦绣社区，通过智能小车、机器人等作品演示和互动体验，让孩子们近距离感受工程与创造的乐趣。</p>
          </div>
        </article>
        <article class="osa-timeline-item">
          <div class="osa-timeline-date"><strong>OSA</strong><span>杯</span></div>
          <img :src="withBase('/association/osa-cup.webp')" alt="OSA 杯竞赛现场" width="1400" height="1050" loading="lazy" decoding="async">
          <div class="osa-timeline-copy">
            <span class="osa-card-label"><CircuitBoard :size="15" aria-hidden="true" /> 实践竞赛</span>
            <h3>OSA 杯</h3>
            <p>围绕电子基础、程序设计和硬件调试设置实践任务。参赛成员在真实设备上验证学习成果，也在现场协作中积累排障经验。</p>
          </div>
        </article>
        <article class="osa-timeline-item">
          <div class="osa-timeline-date"><strong>日常</strong><span>培训</span></div>
          <img :src="withBase('/association/training-bench.webp')" alt="协会嵌入式培训现场" width="1400" height="1050" loading="lazy" decoding="async">
          <div class="osa-timeline-copy">
            <span class="osa-card-label"><GraduationCap :size="15" aria-hidden="true" /> 技术培训</span>
            <h3>蓝桥杯与嵌入式基础训练</h3>
            <p>从单片机基础、外设使用到竞赛题目训练，成员在讲解、任务和复盘中逐步建立完整的开发思路。</p>
          </div>
        </article>
        <article class="osa-timeline-item">
          <div class="osa-timeline-date"><strong>成员</strong><span>交流</span></div>
          <img :src="withBase('/association/hero-group.webp')" alt="开源协会成员见面会合影" width="2000" height="1333" loading="lazy" decoding="async">
          <div class="osa-timeline-copy">
            <span class="osa-card-label"><UsersRound :size="15" aria-hidden="true" /> 协会交流</span>
            <h3>新成员见面会</h3>
            <p>介绍技术方向、学习方式和部门协作，让新成员认识伙伴、明确兴趣，并找到进入协会项目的第一步。</p>
          </div>
        </article>
      </div>
    </div>
  </section>

  <section class="osa-gallery-band">
    <div class="osa-shell">
      <div class="osa-section-heading">
        <div>
          <p class="osa-kicker">更多瞬间</p>
          <h2>把每一次动手都变成可复用的经验</h2>
        </div>
      </div>
      <div class="osa-gallery">
        <figure class="osa-gallery-wide"><img :src="withBase('/association/hands-on-soldering.webp')" alt="成员进行焊接训练" width="1400" height="1050" loading="lazy" decoding="async"><figcaption>焊接与硬件调试</figcaption></figure>
        <figure><img :src="withBase('/association/smart-car-track.webp')" alt="智能小车赛道测试" width="1400" height="1050" loading="lazy" decoding="async"><figcaption>智能小车赛道测试</figcaption></figure>
        <figure><img :src="withBase('/association/robot-dog.webp')" alt="智能机器狗展示" width="1400" height="1050" loading="lazy" decoding="async"><figcaption>机器人项目展示</figcaption></figure>
      </div>
    </div>
  </section>

  <section class="osa-resource-band">
    <div class="osa-shell osa-resource-inner">
      <div>
        <p class="osa-kicker">从现场继续学习</p>
        <h2>活动结束，知识继续开放</h2>
        <p>培训中使用的公开资料会按嵌入式与机器人运动控制方向持续整理。</p>
      </div>
      <div class="osa-resource-actions">
        <a class="osa-button osa-button-primary" :href="withBase('/library/')">进入资料库 <ArrowRight :size="18" aria-hidden="true" /></a>
      </div>
    </div>
  </section>
</main>
