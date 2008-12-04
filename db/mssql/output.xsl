<?xml version="1.0" ?>
<!--
	XML 2 MsSQL XSL transformation for WWW SQL Designer v 2.x
	Version: 0.1
	Author: schliden@gmail.com
-->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:output method="text"/>
<xsl:template match="/sql">

<!-- tables -->
	<xsl:for-each select="table">
		<xsl:text>CREATE TABLE [</xsl:text>
		<xsl:value-of select="@name" />
		<xsl:text>] (
</xsl:text>
		<xsl:for-each select="row">
			<xsl:text>  [</xsl:text>
			<xsl:value-of select="@name" />
			<xsl:text>] </xsl:text>

			<xsl:value-of select="datatype" />
			<xsl:text> </xsl:text>

			<xsl:if test="@null = 0">
				<xsl:text>NOT NULL </xsl:text>
			</xsl:if>

			<xsl:if test="@autoincrement = 1">
				<xsl:text>IDENTITY (1, 1) </xsl:text>
			</xsl:if>

			<xsl:if test="not (position()=last())">
				<xsl:text>,</xsl:text>
			</xsl:if>

			<xsl:if test="comment">
				<xsl:text> -- </xsl:text><xsl:value-of select="comment" />
			</xsl:if>

			<xsl:if test="not (position()=last())">
				<xsl:text>
</xsl:text>
			</xsl:if>
		</xsl:for-each>

		<xsl:text>
) ON [PRIMARY]
GO

</xsl:text>

	</xsl:for-each>
</xsl:template>
</xsl:stylesheet>